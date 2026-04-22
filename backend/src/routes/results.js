import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ocrQueue } from '../jobs/ocrProcess.job.js';

export const resultsRouter = Router();

resultsRouter.get('/job/:jobId', requireAuth, async (req, res) => {
  const jobId = req.params.jobId;
  const job = await ocrQueue.getJob(jobId);
  if (!job) return res.status(404).json({ error: 'not_found' });

  const state = await job.getState();
  if (state === 'waiting' || state === 'active' || state === 'delayed') {
    return res.json({ status: 'processing' });
  }
  if (state === 'failed') {
    return res.json({ status: 'failed', confidence: 0, extractedData: null });
  }
  if (state === 'completed') {
    const rv = job.returnvalue || {};
    return res.json({
      status: rv.status || 'done',
      confidence: rv.confidence,
      extractedData: rv.extracted,
      resultId: rv.resultId,
    });
  }
  return res.json({ status: state });
});
