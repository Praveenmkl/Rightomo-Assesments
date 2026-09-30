const mongoose = require("mongoose");
const Loan = require("../models/Loan");
const Repayment = require("../models/Repayment");
const { calculateLoanSchedule } = require("../services/emiService");
const { sendLoanApprovalEmail } = require("../services/emailService");
const loanStatementQueue = require("../jobs/loanStatementQueue");
const { getSavedStatement } = require("../services/statementService");

/**
 * 1. Create a new loan (supports Reducing Balance & Flat Interest)
 * Generates EMI schedule and stores loan details with initial outstanding balance
 */
const createLoan = async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      loanAmount,
      interestRate,
      tenure,
      interestType,
      startDate: requestedStartDate
    } = req.body;

    const startDate = requestedStartDate ? new Date(requestedStartDate) : new Date();

    // Calculate EMI and schedule
    const calculation = calculateLoanSchedule(
      Number(loanAmount),
      Number(interestRate),
      Number(tenure),
      interestType,
      startDate
    );

    const firstDueDate = calculation.schedule.length > 0 ? calculation.schedule[0].dueDate : null;

    const loan = await Loan.create({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      loanAmount: Number(loanAmount),
      interestRate: Number(interestRate),
      tenure: parseInt(tenure, 10),
      interestType: calculation.interestType,
      emiAmount: calculation.emiAmount,
      totalInterest: calculation.totalInterest,
      totalPayable: calculation.totalPayable,
      outstandingBalance: Number(loanAmount),
      status: "APPROVED",
      startDate,
      dueDate: firstDueDate,
      schedule: calculation.schedule
    });

    // Send email notification asynchronously without blocking response
    sendLoanApprovalEmail(loan).catch((err) => {
      console.error("Failed to send approval email:", err.message);
    });

    res.status(201).json({
      success: true,
      message: "Loan approved successfully",
      loan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Preview / Generate EMI Schedule on-the-fly without persisting
 */
const previewLoanSchedule = async (req, res, next) => {
  try {
    const {
      loanAmount,
      interestRate,
      tenure,
      interestType,
      startDate: requestedStartDate
    } = req.body;

    const startDate = requestedStartDate ? new Date(requestedStartDate) : new Date();

    const calculation = calculateLoanSchedule(
      Number(loanAmount),
      Number(interestRate),
      Number(tenure),
      interestType,
      startDate
    );

    res.status(200).json({
      success: true,
      message: "EMI schedule generated successfully",
      ...calculation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get all loans with optional status and email filters
 */
const getAllLoans = async (req, res, next) => {
  try {
    const { status, customerEmail, interestType } = req.query;
    const filter = {};

    if (status) {
      filter.status = status.toUpperCase();
    }
    if (customerEmail) {
      filter.customerEmail = customerEmail.trim().toLowerCase();
    }
    if (interestType) {
      filter.interestType = interestType.toUpperCase();
    }

    const loans = await Loan.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Loans retrieved successfully",
      count: loans.length,
      loans
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Get loan details by ID including repayment history
 */
const getLoanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    const repayments = await Repayment.find({ loan: loan._id }).sort({ installmentNumber: 1 });

    res.status(200).json({
      success: true,
      message: "Loan retrieved successfully",
      loan,
      repayments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Repay an installment for a loan and update outstanding balance
 */
const repayLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    if (loan.status === "CLOSED") {
      return res.status(400).json({
        success: false,
        message: "Loan is already closed"
      });
    }

    // Find next unpaid installment
    const installment = loan.schedule.find((item) => item.paid === false);

    if (!installment) {
      loan.status = "CLOSED";
      loan.outstandingBalance = 0;
      await loan.save();

      return res.status(400).json({
        success: false,
        message: "No unpaid installments found for this loan"
      });
    }

    // Validate repayment amount against current installment EMI
    if (amount < installment.emi) {
      return res.status(400).json({
        success: false,
        message: `Minimum repayment amount is ${installment.emi}`
      });
    }

    // Mark installment as paid
    installment.paid = true;

    // Deduct principal portion of the installment from outstanding balance
    const updatedBalance = Math.max(0, loan.outstandingBalance - installment.principal);
    loan.outstandingBalance = Number(updatedBalance.toFixed(2));

    // Check if loan is now fully settled
    const hasRemainingUnpaid = loan.schedule.some((item) => item.paid === false);
    if (!hasRemainingUnpaid || loan.outstandingBalance <= 0) {
      loan.outstandingBalance = 0;
      loan.status = "CLOSED";
    }

    await loan.save();

    // Store repayment transaction record
    const repayment = await Repayment.create({
      loan: loan._id,
      amount: Number(amount),
      installmentNumber: installment.installmentNumber,
      principalPaid: installment.principal,
      interestPaid: installment.interest,
      remainingBalance: loan.outstandingBalance,
      paymentDate: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Repayment successful",
      repayment,
      outstandingBalance: loan.outstandingBalance,
      loanStatus: loan.status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Retrieve loan EMI schedule
 */
const getLoanSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Loan schedule retrieved successfully",
      loanId: loan._id,
      customerName: loan.customerName,
      loanAmount: loan.loanAmount,
      interestRate: loan.interestRate,
      interestType: loan.interestType,
      tenure: loan.tenure,
      emiAmount: loan.emiAmount,
      totalInterest: loan.totalInterest,
      totalPayable: loan.totalPayable,
      outstandingBalance: loan.outstandingBalance,
      schedule: loan.schedule
    });

    // Automatically queue background loan statement generation
    try {
      loanStatementQueue.addLoanStatementJob(loan._id.toString());
    } catch (queueErr) {
      console.error("Queue job error:", queueErr.message);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Retrieve all repayments for a specific loan
 */
const getLoanRepayments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    const repayments = await Repayment.find({ loan: loan._id }).sort({ installmentNumber: 1 });
    const totalRepaid = Number(repayments.reduce((sum, r) => sum + r.amount, 0).toFixed(2));

    res.status(200).json({
      success: true,
      message: "Loan repayments retrieved successfully",
      loanId: loan._id,
      count: repayments.length,
      totalRepaid,
      outstandingBalance: loan.outstandingBalance,
      loanStatus: loan.status,
      repayments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Queue a background job to generate a loan statement
 */
const requestLoanStatement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    const job = loanStatementQueue.addLoanStatementJob(loan._id.toString());

    res.status(202).json({
      success: true,
      message: "Loan statement generation queued successfully",
      job
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Retrieve previously stored local statement for a loan
 */
const getStoredLoanStatement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    const statement = await getSavedStatement(loan._id.toString());

    if (!statement) {
      return res.status(404).json({
        success: false,
        message: "Statement has not been generated yet. Please trigger generation first."
      });
    }

    res.status(200).json({
      success: true,
      message: "Stored loan statement retrieved successfully",
      statement
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLoan,
  previewLoanSchedule,
  getAllLoans,
  getLoanById,
  repayLoan,
  getLoanSchedule,
  getLoanRepayments,
  requestLoanStatement,
  getStoredLoanStatement
};
