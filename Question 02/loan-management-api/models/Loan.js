const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true
    },

    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
      trim: true,
      lowercase: true
    },

    loanAmount: {
      type: Number,
      required: [true, "Loan amount is required"],
      min: [1, "Loan amount must be greater than 0"]
    },

    interestRate: {
      type: Number,
      required: [true, "Interest rate is required"],
      min: [0, "Interest rate cannot be negative"]
    },

    tenure: {
      type: Number,
      required: [true, "Tenure is required"],
      min: [1, "Tenure must be at least 1 month"]
    },

    interestType: {
      type: String,
      enum: {
        values: ["REDUCING", "FLAT"],
        message: "Interest type must be either REDUCING or FLAT"
      },
      required: [true, "Interest type is required"]
    },

    emiAmount: {
      type: Number,
      required: [true, "EMI amount is required"]
    },

    totalInterest: {
      type: Number,
      default: 0
    },

    totalPayable: {
      type: Number,
      default: 0
    },

    outstandingBalance: {
      type: Number,
      required: [true, "Outstanding balance is required"]
    },

    status: {
      type: String,
      enum: {
        values: ["PENDING", "APPROVED", "CLOSED"],
        message: "Status must be PENDING, APPROVED, or CLOSED"
      },
      default: "APPROVED"
    },

    startDate: {
      type: Date,
      default: Date.now
    },

    dueDate: {
      type: Date
    },

    schedule: [
      {
        installmentNumber: Number,
        dueDate: Date,
        emi: Number,
        principal: Number,
        interest: Number,
        balance: Number,
        paid: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Loan", loanSchema);