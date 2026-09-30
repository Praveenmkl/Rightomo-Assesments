const nodemailer = require("nodemailer");

const createTransporter = () => {
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
  const pass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.trim() : "";

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    }
  });
};

/**
 * Send an email notification when a loan is approved
 * Required fields included: customer name, loan amount, EMI amount, due date
 */
const sendLoanApprovalEmail = async (loan) => {
  try {
    const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
    const pass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.trim() : "";

    if (!user || !pass) {
      console.warn("[Email Notification] EMAIL_USER or EMAIL_PASSWORD not configured in .env. Skipping actual mail delivery.");
      return { success: false, message: "Email credentials not configured" };
    }

    const transporter = createTransporter();

    const formattedAmount = Number(loan.loanAmount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const formattedEmi = Number(loan.emiAmount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const formattedDueDate = loan.dueDate ? new Date(loan.dueDate).toDateString() : "N/A";

    const mailOptions = {
      from: `"Loan Management System" <${user}>`,
      to: loan.customerEmail,
      subject: `Loan Approved - Account #${loan._id}`,
      text: `Dear ${loan.customerName},

Congratulations! Your loan application has been approved.

Loan Details:
- Customer Name: ${loan.customerName}
- Loan Amount: $${formattedAmount}
- Monthly EMI: $${formattedEmi}
- First Due Date: ${formattedDueDate}
- Interest Type: ${loan.interestType}
- Tenure: ${loan.tenure} months

Thank you for choosing our services.

Best regards,
Loan Management Team`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #000; padding: 20px; max-width: 600px;">
          <h2 style="color: #000; margin-top: 0; border-bottom: 2px solid #000; padding-bottom: 8px;">Loan Approval Confirmation</h2>
          <p>Dear ${loan.customerName},</p>
          <p>Your loan application has been approved successfully.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #ccc;"><strong>Customer Name:</strong></td>
              <td style="padding: 6px 0; border-bottom: 1px solid #ccc; text-align: right;">${loan.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #ccc;"><strong>Loan Amount:</strong></td>
              <td style="padding: 6px 0; border-bottom: 1px solid #ccc; text-align: right;">$${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #ccc;"><strong>Monthly EMI:</strong></td>
              <td style="padding: 6px 0; border-bottom: 1px solid #ccc; text-align: right;">$${formattedEmi}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #ccc;"><strong>First Due Date:</strong></td>
              <td style="padding: 6px 0; border-bottom: 1px solid #ccc; text-align: right;">${formattedDueDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #ccc;"><strong>Interest Type:</strong></td>
              <td style="padding: 6px 0; border-bottom: 1px solid #ccc; text-align: right;">${loan.interestType}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0;"><strong>Tenure:</strong></td>
              <td style="padding: 6px 0; text-align: right;">${loan.tenure} months</td>
            </tr>
          </table>
          <p>Thank you.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Notification] Approval email sent to ${loan.customerEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Notification] Failed to send loan approval email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendLoanApprovalEmail
};