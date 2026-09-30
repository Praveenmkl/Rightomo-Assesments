const fs = require("fs");
const path = require("path");
const Loan = require("../models/Loan");
const Repayment = require("../models/Repayment");

const STATEMENTS_DIR = path.join(__dirname, "..", "statements");

/**
 * Ensure storage directory exists
 */
const ensureStorageDir = () => {
  if (!fs.existsSync(STATEMENTS_DIR)) {
    fs.mkdirSync(STATEMENTS_DIR, { recursive: true });
  }
};

/**
 * Fetch and construct comprehensive statement data from database
 */
const generateStatementData = async (loanId) => {
  const loan = await Loan.findById(loanId).lean();

  if (!loan) {
    throw new Error(`Loan with ID ${loanId} not found`);
  }

  const repayments = await Repayment.find({ loan: loan._id })
    .sort({ installmentNumber: 1 })
    .lean();

  const totalRepaid = Number(repayments.reduce((sum, r) => sum + r.amount, 0).toFixed(2));
  const totalPrincipalRepaid = Number(repayments.reduce((sum, r) => sum + (r.principalPaid || 0), 0).toFixed(2));
  const totalInterestRepaid = Number(repayments.reduce((sum, r) => sum + (r.interestPaid || 0), 0).toFixed(2));

  const totalInstallments = loan.schedule.length;
  const paidInstallments = loan.schedule.filter((s) => s.paid).length;
  const remainingInstallments = totalInstallments - paidInstallments;

  return {
    statementId: `STMT-${loan._id}-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    customer: {
      name: loan.customerName,
      email: loan.customerEmail
    },
    loanSummary: {
      loanId: loan._id,
      loanAmount: loan.loanAmount,
      interestRate: loan.interestRate,
      interestType: loan.interestType,
      tenureMonths: loan.tenure,
      emiAmount: loan.emiAmount,
      totalInterest: loan.totalInterest,
      totalPayable: loan.totalPayable,
      status: loan.status,
      startDate: loan.startDate,
      firstDueDate: loan.dueDate
    },
    accountBalance: {
      outstandingBalance: loan.outstandingBalance,
      totalRepaid,
      totalPrincipalRepaid,
      totalInterestRepaid,
      paidInstallments,
      remainingInstallments
    },
    repayments: repayments.map((r) => ({
      installmentNumber: r.installmentNumber,
      amount: r.amount,
      principalPaid: r.principalPaid,
      interestPaid: r.interestPaid,
      remainingBalance: r.remainingBalance,
      paymentDate: r.paymentDate
    })),
    schedule: loan.schedule
  };
};

/**
 * Save statement data locally as a formatted JSON file
 */
const saveStatementLocally = async (loanId, statementData) => {
  ensureStorageDir();

  const fileName = `loan-${loanId}.json`;
  const filePath = path.join(STATEMENTS_DIR, fileName);

  await fs.promises.writeFile(filePath, JSON.stringify(statementData, null, 2), "utf8");

  return {
    fileName,
    filePath,
    savedAt: new Date().toISOString()
  };
};

/**
 * Retrieve saved local statement if it exists
 */
const getSavedStatement = async (loanId) => {
  ensureStorageDir();

  const filePath = path.join(STATEMENTS_DIR, `loan-${loanId}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const rawData = await fs.promises.readFile(filePath, "utf8");
  return JSON.parse(rawData);
};

module.exports = {
  generateStatementData,
  saveStatementLocally,
  getSavedStatement,
  STATEMENTS_DIR
};
