const loanStatementQueue = require("./loanStatementQueue");
const { generateStatementData, saveStatementLocally } = require("../services/statementService");

let isWorking = false;

/**
 * Worker execution unit: processes jobs sequentially from the queue
 */
const processQueue = async () => {
  if (isWorking) {
    return;
  }

  const job = loanStatementQueue.getNextJob();
  if (!job) {
    return;
  }

  isWorking = true;

  try {
    console.log(`[Worker] Started processing job ${job.jobId} for loan ${job.loanId}`);
    loanStatementQueue.updateJobStatus(job.jobId, "PROCESSING");

    // 1. Generate full statement data (customer, loan, repayments, balance, schedule)
    const statementData = await generateStatementData(job.loanId);

    // 2. Save statement locally as a JSON document in the /statements folder
    const fileResult = await saveStatementLocally(job.loanId, statementData);

    // 3. Mark job as completed
    loanStatementQueue.updateJobStatus(job.jobId, "COMPLETED", {
      result: fileResult
    });

    console.log(`[Worker] Job ${job.jobId} completed successfully. Statement stored at: ${fileResult.filePath}`);
  } catch (error) {
    console.error(`[Worker] Job ${job.jobId} failed:`, error.message);

    loanStatementQueue.updateJobStatus(job.jobId, "FAILED", {
      error: error.message
    });
  } finally {
    isWorking = false;

    // If there are still items pending in queue, immediately process next
    if (loanStatementQueue.getQueueLength() > 0) {
      setImmediate(processQueue);
    }
  }
};

// Listen for new jobs added to queue for immediate event-driven processing
loanStatementQueue.on("jobAdded", () => {
  setImmediate(processQueue);
});

// Periodic fallback check every 5 seconds to ensure queue resilience
setInterval(processQueue, 5000);

module.exports = {
  processQueue
};