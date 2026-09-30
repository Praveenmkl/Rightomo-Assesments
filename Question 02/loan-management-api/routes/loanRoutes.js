const express = require("express");
const {
  createLoan,
  previewLoanSchedule,
  getAllLoans,
  getLoanById,
  repayLoan,
  getLoanSchedule,
  getLoanRepayments,
  requestLoanStatement,
  getStoredLoanStatement
} = require("../controllers/loanController");

const {
  validateCreateLoan,
  validateCalculateSchedule,
  validateLoanId,
  validateRepayment
} = require("../middleware/validator");

const router = express.Router();

// Preview/Calculate EMI schedule before creating a loan
router.post("/calculate", validateCalculateSchedule, previewLoanSchedule);

// Create a new loan (Flat or Reducing Balance)
router.post("/", validateCreateLoan, createLoan);

// Get all loans (with optional query filters: status, customerEmail, interestType)
router.get("/", getAllLoans);

// Get loan by ID (including populated repayment history)
router.get("/:id", validateLoanId, getLoanById);

// Repay an installment for a loan
router.post("/:id/repay", validateLoanId, validateRepayment, repayLoan);

// Get the EMI schedule for an existing loan (also enqueues statement generation)
router.get("/:id/schedule", validateLoanId, getLoanSchedule);

// Get all repayments for an existing loan
router.get("/:id/repayments", validateLoanId, getLoanRepayments);

// Manually queue background job to generate loan statement
router.post("/:id/statement", validateLoanId, requestLoanStatement);

// Get locally saved statement file content
router.get("/:id/statement", validateLoanId, getStoredLoanStatement);

module.exports = router;
