import { prisma } from '../db.js';
import { releaseEscrowForWinner } from './escrow.service.js';
import { getIo } from '../ioSingleton.js';

function parseMaybeInt(v) {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  const s = String(v).trim();
  const m = s.match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) ? n : null;
}

async function visionText(imageBuffer) {
  try {
    const vision = await import('@google-cloud/vision');
    const keyFile = process.env.GCP_KEY_FILE;
    if (!keyFile) return '';
    const client = new vision.ImageAnnotatorClient({ keyFilename: keyFile });
    const [result] = await client.textDetection(imageBuffer);
    return result.fullTextAnnotation?.text || '';
  } catch (e) {
    console.log('[ocr] vision skipped', e?.message || e);
    return '';
  }
}

async function geminiExtract(game, fullText) {
  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || 'us-central1';
  const modelId = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  if (!project) return null;

  try {
    const { VertexAI } = await import('@google-cloud/vertexai');
    const vertex = new VertexAI({ project, location });
    const model = vertex.getGenerativeModel({ model: modelId });
    const prompt =
      game === 'cs2'
        ? `Extract from this CS2 match result screenshot:
      - match_id: the match share code or match ID if visible
      - player_name: the highlighted player name
      - placement: final placement number (1st, 2nd etc) or score
      - kills: number of kills
      - deaths: number of deaths
      - assists: number of assists
      - mvp: boolean if MVP star shown
      Return ONLY valid JSON. If a field is not found, use null.
      Text extracted from screenshot: ${fullText}`
        : `Extract from this Dota 2 match result screenshot:
      - match_id: the match ID number
      - player_name: the highlighted player name
      - hero_name: the hero played
      - placement: "Radiant Victory" or "Dire Victory"
      - kills: number of kills
      - deaths: number of deaths
      - assists: number of assists
      - gpm: gold per minute
      - xpm: experience per minute
      Return ONLY valid JSON. If a field is not found, use null.
      Text extracted from screenshot: ${fullText}`;

    const resp = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const text =
      resp?.response?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    return JSON.parse(m[0]);
  } catch (e) {
    console.log('[ocr] gemini failed', e?.message || e);
    return null;
  }
}

export async function processScreenshot({ imageBuffer, tournamentId, userId, tournamentRoomDbId, imageUrl }) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw new Error('tournament_not_found');
  const game = tournament.game;

  const fullText = await visionText(imageBuffer);
  let extracted = await geminiExtract(game, fullText);
  if (!extracted) {
    extracted = {
      match_id: null,
      player_name: null,
      placement: null,
      kills: null,
      deaths: null,
      assists: null,
    };
  }

  const otherResults = await prisma.matchResult.findMany({
    where: {
      roomId: tournamentRoomDbId,
      status: { in: ['ai_confirmed', 'human_confirmed'] },
    },
  });

  let confidence = 0.5;
  if (extracted.match_id) confidence += 0.15;
  if (extracted.player_name) confidence += 0.1;
  if (extracted.placement !== null && extracted.placement !== undefined) confidence += 0.15;

  if (otherResults.length > 0 && extracted.match_id) {
    const matchIdConsistent = otherResults.every(
      (r) => String(r.extractedData?.match_id) === String(extracted.match_id),
    );
    if (matchIdConsistent) confidence += 0.2;
    else confidence -= 0.3;
  }
  if (otherResults.length >= 3) confidence += 0.1;
  confidence = Math.min(Math.max(confidence, 0), 1);

  const status = confidence >= 0.9 ? 'ai_confirmed' : 'ai_flagged';

  const placement = parseMaybeInt(extracted.placement);
  const kills = parseMaybeInt(extracted.kills);

  const created = await prisma.matchResult.create({
    data: {
      tournamentId,
      roomId: tournamentRoomDbId,
      userId,
      steamMatchId: extracted.match_id != null ? String(extracted.match_id) : null,
      placement,
      kills,
      screenshotUrl: imageUrl,
      aiConfidence: confidence,
      extractedData: extracted,
      status,
    },
  });

  const io = getIo();
  if (status === 'ai_confirmed') {
    await releaseEscrowForWinner(tournamentId, tournamentRoomDbId, extracted);
    io.to(`tournament:${tournamentId}`).emit(`tournament:${tournamentId}:result_confirmed`, {
      roomId: tournamentRoomDbId,
      winnerId: null,
      nextMatch: null,
    });
  } else {
    io.to('referee_room').emit('referee:new_flag', {
      resultId: created.id,
      tournamentId,
      confidence: Math.round(confidence * 100),
    });
  }

  return { confidence, status, extracted, resultId: created.id };
}
