class MemoryJob {
  constructor(id, data) {
    this.id = id;
    this.data = data;
    this.returnvalue = undefined;
    this.failedReason = undefined;
    this._state = 'waiting';
  }

  async getState() {
    const s = this._state;
    if (s === 'waiting') return 'waiting';
    if (s === 'active') return 'active';
    if (s === 'completed') return 'completed';
    if (s === 'failed') return 'failed';
    return 'waiting';
  }
}

export function createQueue(_name, options = {}) {
  const concurrency = Math.max(1, options.concurrency ?? 2);
  let processor = null;
  const jobs = new Map();
  let nextId = 1;
  const pending = [];
  let active = 0;

  async function worker() {
    if (!processor || active >= concurrency || pending.length === 0) return;
    active += 1;
    const job = pending.shift();
    job._state = 'active';
    try {
      const rv = await processor(job);
      job.returnvalue = rv;
      job._state = 'completed';
    } catch (e) {
      job.failedReason = e?.message || String(e);
      job._state = 'failed';
    } finally {
      active -= 1;
      worker();
    }
  }

  return {
    process(fn) {
      processor = fn;
      worker();
    },

    async add(_jobName, data) {
      const id = String(nextId++);
      const job = new MemoryJob(id, data);
      jobs.set(id, job);
      pending.push(job);
      worker();
      return job;
    },

    async getJob(jobId) {
      const j = jobs.get(String(jobId));
      return j ?? null;
    },
  };
}
