const mongoose = require("mongoose");

const repaymentSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: [true, "Loan reference is required"]
    },

    amount: {
      type: Number,
      required: [true, "Repayment amount is required"],
      min: [0.01, "Repayment amount must be greater than 0"]
    },

    installmentNumber: {
      type: Number,
      required: [true, "Installment number is required"]
    },

    principalPaid: {
      type: Number,
      default: 0
    },

    interestPaid: {
      type: Number,
      default: 0
    },

    remainingBalance: {
      type: Number,
      default: 0
    },

    paymentDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Repayment", repaymentSchema);