/**
 * Loan Calculator Utility
 * Supports Reducing Balance and Flat Interest calculation models
 */

/**
 * Calculate EMI for Reducing Balance (Amortization model)
 * Formula: EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
 * where r = annualRate / 12 / 100, n = tenure in months
 */
function calculateReducingEMI(principal, annualRate, months) {
  const p = Number(principal);
  const rAnnual = Number(annualRate);
  const n = parseInt(months, 10);

  if (p <= 0 || n <= 0) return 0;

  const monthlyRate = rAnnual / 12 / 100;

  if (monthlyRate === 0) {
    return Number((p / n).toFixed(2));
  }

  const emi =
    (p * monthlyRate * Math.pow(1 + monthlyRate, n)) /
    (Math.pow(1 + monthlyRate, n) - 1);

  return Number(emi.toFixed(2));
}

/**
 * Calculate EMI for Flat Interest loan
 * Formula: Total Interest = P * (annualRate / 100) * (months / 12)
 * Total Payable = P + Total Interest
 * EMI = Total Payable / months
 */
function calculateFlatEMI(principal, annualRate, months) {
  const p = Number(principal);
  const rAnnual = Number(annualRate);
  const n = parseInt(months, 10);

  if (p <= 0 || n <= 0) return 0;

  const years = n / 12;
  const totalInterest = p * (rAnnual / 100) * years;
  const totalPayment = p + totalInterest;

  return Number((totalPayment / n).toFixed(2));
}

/**
 * Generate monthly schedule for Reducing Balance loan
 */
function generateReducingSchedule(principal, annualRate, months, emi, startDate = new Date()) {
  const p = Number(principal);
  const rAnnual = Number(annualRate);
  const n = parseInt(months, 10);
  const monthlyRate = rAnnual / 12 / 100;

  const schedule = [];
  let balance = p;

  for (let i = 1; i <= n; i++) {
    const interest = Number((balance * monthlyRate).toFixed(2));
    let principalPayment = Number((emi - interest).toFixed(2));
    let currentEmi = emi;

    // Adjust in final month or if principal payment exceeds remaining balance
    if (i === n || balance - principalPayment < 0) {
      principalPayment = Number(balance.toFixed(2));
      currentEmi = Number((principalPayment + interest).toFixed(2));
      balance = 0;
    } else {
      balance = Number((balance - principalPayment).toFixed(2));
    }

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      dueDate,
      emi: Number(currentEmi.toFixed(2)),
      principal: Number(principalPayment.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      balance: Number(balance.toFixed(2)),
      paid: false
    });
  }

  return schedule;
}

/**
 * Generate monthly schedule for Flat Interest loan
 */
function generateFlatSchedule(principal, annualRate, months, emi, startDate = new Date()) {
  const p = Number(principal);
  const rAnnual = Number(annualRate);
  const n = parseInt(months, 10);

  const totalInterest = p * (rAnnual / 100) * (n / 12);
  const monthlyInterest = Number((totalInterest / n).toFixed(2));
  const monthlyPrincipal = Number((p / n).toFixed(2));

  const schedule = [];
  let balance = p;

  for (let i = 1; i <= n; i++) {
    let principalPayment = monthlyPrincipal;
    let interestPayment = monthlyInterest;
    let currentEmi = emi;

    // Final month adjustment to balance out rounding cents
    if (i === n) {
      principalPayment = Number(balance.toFixed(2));
      balance = 0;
      currentEmi = Number((principalPayment + interestPayment).toFixed(2));
    } else {
      balance = Number((balance - principalPayment).toFixed(2));
      if (balance < 0) balance = 0;
    }

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      dueDate,
      emi: Number(currentEmi.toFixed(2)),
      principal: Number(principalPayment.toFixed(2)),
      interest: Number(interestPayment.toFixed(2)),
      balance: Number(balance.toFixed(2)),
      paid: false
    });
  }

  return schedule;
}

/**
 * Unified calculation function returning EMI, totals, and full schedule
 */
function calculateLoanSchedule(principal, annualRate, months, interestType, startDate = new Date()) {
  const type = String(interestType).toUpperCase();
  let emi;
  let schedule;

  if (type === "REDUCING") {
    emi = calculateReducingEMI(principal, annualRate, months);
    schedule = generateReducingSchedule(principal, annualRate, months, emi, startDate);
  } else if (type === "FLAT") {
    emi = calculateFlatEMI(principal, annualRate, months);
    schedule = generateFlatSchedule(principal, annualRate, months, emi, startDate);
  } else {
    throw new Error("Invalid interest type. Allowed types are REDUCING and FLAT.");
  }

  const totalInterest = Number(schedule.reduce((acc, row) => acc + row.interest, 0).toFixed(2));
  const totalPayable = Number((Number(principal) + totalInterest).toFixed(2));

  return {
    loanAmount: Number(principal),
    interestRate: Number(annualRate),
    tenure: parseInt(months, 10),
    interestType: type,
    emiAmount: emi,
    totalInterest,
    totalPayable,
    schedule
  };
}

module.exports = {
  calculateReducingEMI,
  calculateFlatEMI,
  generateReducingSchedule,
  generateFlatSchedule,
  calculateLoanSchedule
};
