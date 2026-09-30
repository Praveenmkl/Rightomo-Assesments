const EventEmitter = require("events");

class LoanStatementQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.jobs = new Map(); // Store job metadata by jobId
    this.jobCounter = 1;
  }

  /**
   * Add a loan statement generation task to the queue
   */
  addLoanStatementJob(loanId) {
    const jobId = `job_${Date.now()}_${this.jobCounter++}`;

    const job = {
      jobId,
      loanId: loanId.toString(),
      status: "QUEUED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      error: null
    };

    this.jobs.set(jobId, job);
    this.queue.push(job);

    console.log(`[Queue] Added job ${jobId} for loan ${loanId}. Queue length: ${this.queue.length}`);

    // Notify listeners (worker) that a new job is available
    this.emit("jobAdded", job);

    return job;
  }

  /**
   * Get the next job from queue
   */
  getNextJob() {
    return this.queue.shift();
  }

  /**
   * Update the status and details of a job
   */
  updateJobStatus(jobId, status, details = {}) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      job.updatedAt = new Date().toISOString();
      Object.assign(job, details);
    }
  }

  /**
   * Get status of a specific job
   */
  getJobStatus(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get total remaining queue count
   */
  getQueueLength() {
    return this.queue.length;
  }
}

// Singleton queue instance
const loanStatementQueue = new LoanStatementQueue();

module.exports = loanStatementQueue;