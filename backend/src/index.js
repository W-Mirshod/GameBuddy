import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { teamsRouter } from './routes/teams.js';
import { tournamentsRouter } from './routes/tournaments.js';
import { resultsRouter } from './routes/results.js';
import { refereeRouter } from './routes/referee.js';
import { paymentsRouter } from './routes/payments.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { registerSocketHandlers } from './socket/handlers.js';
import { registerSteamRefreshScheduler } from './jobs/steamRefresh.job.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: true, credentials: true } });

export const prisma = new PrismaClient();
export { io };

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/teams', teamsRouter);
app.use('/tournaments', tournamentsRouter);
app.use('/results', resultsRouter);
app.use('/referee', refereeRouter);
app.use('/payments', paymentsRouter);
app.use('/leaderboard', leaderboardRouter);

app.use((err, req, res, next) => {
  console.log('[backend] error', err?.message || err);
  res.status(500).json({ error: 'internal_error' });
});

registerSocketHandlers(io);
registerSteamRefreshScheduler().catch((e) => console.log('[steamRefresh] scheduler error', e));

const port = Number(process.env.PORT || 3001);
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`[backend] listening on ${port}`);
});

