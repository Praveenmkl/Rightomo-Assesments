const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const loanRoutes = require("./routes/loanRoutes");
const errorHandler = require("./middleware/errorHandler");
require("./jobs/loanStatementWorker");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Loan Management API is running",
    endpoints: {
      calculateSchedule: "POST /api/loans/calculate",
      createLoan: "POST /api/loans",
      getAllLoans: "GET /api/loans",
      getLoanById: "GET /api/loans/:id",
      repayLoan: "POST /api/loans/:id/repay",
      getLoanSchedule: "GET /api/loans/:id/schedule",
      getLoanRepayments: "GET /api/loans/:id/repayments",
      queueStatementJob: "POST /api/loans/:id/statement",
      getStoredStatement: "GET /api/loans/:id/statement"
    }
  });
});

app.use("/api/loans", loanRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });
