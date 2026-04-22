import { readFile, unlink } from 'fs/promises';
import { createQueue } from './queue.js';
import { processScreenshot } from '../services/ocr.service.js';
import { getIo } from '../ioSingleton.js';

export const ocrQueue = createQueue('ocr_process');

ocrQueue.process(async (job) => {
  const { filePath, tournamentId, userId, tournamentRoomDbId, imageUrl } = job.data;
  console.log('[ocr] job start', job.id);
  try {
    const buf = await readFile(filePath);
    const result = await processScreenshot({
      imageBuffer: buf,
      tournamentId,
      userId,
      tournamentRoomDbId,
      imageUrl,
    });
    try {
      await unlink(filePath);
    } catch {
      // ignore
    }
    const io = getIo();
    io.to(`result:job:${job.id}`).emit(`result:job:${job.id}:done`, {
      confidence: result.confidence,
      status: result.status,
      extractedData: result.extracted,
      resultId: result.resultId,
    });
    return result;
  } catch (e) {
    console.log('[ocr] job error', e?.message || e);
    const io = getIo();
    io.to(`result:job:${job.id}`).emit(`result:job:${job.id}:done`, {
      confidence: 0,
      status: 'failed',
      extractedData: null,
    });
    throw e;
  }
});
