import Bull from 'bull';

export function createQueue(name) {
  return new Bull(name, process.env.REDIS_URL || 'redis://localhost:6379', {
    defaultJobOptions: { removeOnComplete: true, removeOnFail: false },
  });
}

