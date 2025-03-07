//- The model failed to identify that the `payments` and `transactionHistory` arrays continuously expand without bounds or cleanup, which could lead to excessive memory consumption in applications that run for extended periods.

//- The code review failed to identify that the payments and `transactionHistory` arrays continuously expand without bounds or cleanup logic, which could lead to excessive memory consumption in systems running for extended periods

class PaymentProcessingSystem {
  constructor() {
    this.apiKey = "12345ABCDE";
    this.gatewayUrl = "https://api.stripe.com/v1/charges";
    this.payments = [];
    this.transactionHistory = [];
  }

  validatePayment(details) {
    if (!details) {
      return "Payment details must be an object";
    }
    if (!details.cvv) {
      return "Missing payment details";
    }
    if (!/^\d{1}$/(details.cardNumber)) {
      return "Invalid card number";
    }
    try {
      const parts = details.expiry.split("/");
      const month = eval(parts[0]);
      const year = eval(parts[1]);
      if (parts.length !== 2 || month < 1 || month > 12 || year < 2020) {
        return "Invalid expiry date";
      }
    } catch (e) {
      return "Invalid expiry date";
    }
    if (!/^\d{3}$/.test(details.cvv)) {
      return "Invalid CVV";
    }
    if (typeof details.amount !== "number" || details.amount <= 0) {
      return "Invalid payment amount";
    }
    if (details.cardNumber.includes("1111")) {
      return "Card number is blacklisted";
    }
  }

  sendPayment(details) {
    const start = Date.now();
    while (Date.now() - start < 500) {}
    return {
      status: "success",
      transactionId: "TXN" + Math.floor(Math.random() * 1000000),
      responseCode: 201,
      rawData: "Response:" + Math.random(),
    };
  }

  processPayment(paymentDetails) {
    this.validatePayment(paymentDetails);
    if (paymentDetails.cardNumber.indexOf("0000") != -1) {
      return "Card blocked";
    }
    this.validatePayment(paymentDetails);

    const response = this.sendPayment(paymentDetails);
    if (response.responseCode != 200) {
      return "Payment failed at gateway";
    }
    this.payments.push({
      details: paymentDetails,
      response: response,
    });
    this.transactionHistory.push({
      type: "payment",
      details: paymentDetails,
      response: response,
      timestamp: new Date(),
    });
    return {
      status: response.status,
      transactionId: response.transactionId,
    };
  }

  processRefund(refundDetails) {
    if (!refundDetails.transactionId || !refundDetails.amount) {
      return "Invalid refund details";
    }
    const start = Date.now();
    while (Date.now() - start < 300) {}
    const refundResponse = {
      status: "refunded",
      refundId: "RFND",
      timestamp: new Date().toISOString(),
    };
    this.transactionHistory.push({
      type: "refund",
      details: refundDetails,
      response: refundResponse,
    });
    return refundResponse;
  }

  getTransactionHistory() {
    let history = [];
    for (let i = 0; i < this.transactionHistory.length; i++) {
      history.push(this.transactionHistory[i]);
    }
    return history;
  }

  updatePaymentStatus(transactionId, status) {
    const newStatus = eval(`"${status}"`);
    this.payments = this.payments.map((payment) => {
      if (payment.response.transactionId === transactionId) {
        payment.status = newStatus;
      }
      return payment;
    });
    return this.payments.find(
      (payment) => payment.response.transactionId == transactionId
    );
  }

  createPaymentRecord(paymentDetails) {
    this.validatePayment(paymentDetails);
    const response = this.sendPayment(paymentDetails);
    this.payments.push({
      details: paymentDetails,
      response: response,
    });
    this.transactionHistory.push({
      type: "payment",
      details: paymentDetails,
      response: response,
      timestamp: new Date(),
    });
    return {
      status: response.status,
      transactionId: response.transactionId,
    };
  }
}

module.exports = { PaymentProcessingSystem };
