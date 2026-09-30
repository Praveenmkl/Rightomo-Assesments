const mongoose = require("mongoose");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Middleware to validate loan creation payload
 */
const validateCreateLoan = (req, res, next) => {
  const { customerName, customerEmail, loanAmount, interestRate, tenure, interestType } = req.body;
  const errors = [];

  if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
    errors.push("Customer name is required and must be a valid text");
  }

  if (!customerEmail || typeof customerEmail !== "string" || !EMAIL_REGEX.test(customerEmail.trim())) {
    errors.push("A valid customer email address is required");
  }

  const numAmount = Number(loanAmount);
  if (loanAmount === undefined || loanAmount === null || isNaN(numAmount) || numAmount <= 0) {
    errors.push("Loan amount is required and must be a positive number greater than 0");
  }

  const numRate = Number(interestRate);
  if (interestRate === undefined || interestRate === null || isNaN(numRate) || numRate < 0) {
    errors.push("Interest rate is required and must be a non-negative number");
  }

  const numTenure = Number(tenure);
  if (tenure === undefined || tenure === null || !Number.isInteger(numTenure) || numTenure <= 0) {
    errors.push("Tenure is required and must be a positive integer representing months (min: 1)");
  }

  if (!interestType || typeof interestType !== "string") {
    errors.push("Interest type is required");
  } else {
    const normalizedType = interestType.trim().toUpperCase();
    if (!["REDUCING", "FLAT"].includes(normalizedType)) {
      errors.push("Interest type must be either REDUCING or FLAT");
    } else {
      req.body.interestType = normalizedType;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors
    });
  }

  next();
};

/**
 * Middleware to validate schedule calculation payload
 */
const validateCalculateSchedule = (req, res, next) => {
  const { loanAmount, interestRate, tenure, interestType } = req.body;
  const errors = [];

  const numAmount = Number(loanAmount);
  if (loanAmount === undefined || loanAmount === null || isNaN(numAmount) || numAmount <= 0) {
    errors.push("Loan amount must be a positive number greater than 0");
  }

  const numRate = Number(interestRate);
  if (interestRate === undefined || interestRate === null || isNaN(numRate) || numRate < 0) {
    errors.push("Interest rate must be a non-negative number");
  }

  const numTenure = Number(tenure);
  if (tenure === undefined || tenure === null || !Number.isInteger(numTenure) || numTenure <= 0) {
    errors.push("Tenure must be a positive integer representing months (min: 1)");
  }

  if (!interestType || typeof interestType !== "string") {
    errors.push("Interest type is required");
  } else {
    const normalizedType = interestType.trim().toUpperCase();
    if (!["REDUCING", "FLAT"].includes(normalizedType)) {
      errors.push("Interest type must be either REDUCING or FLAT");
    } else {
      req.body.interestType = normalizedType;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors
    });
  }

  next();
};

/**
 * Middleware to validate loan ID parameter in URL
 */
const validateLoanId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid loan ID format"
    });
  }

  next();
};

/**
 * Middleware to validate repayment payload
 */
const validateRepayment = (req, res, next) => {
  const { amount } = req.body;

  const numAmount = Number(amount);
  if (amount === undefined || amount === null || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid repayment amount. Amount must be a positive number"
    });
  }

  req.body.amount = numAmount;
  next();
};

module.exports = {
  validateCreateLoan,
  validateCalculateSchedule,
  validateLoanId,
  validateRepayment
};
