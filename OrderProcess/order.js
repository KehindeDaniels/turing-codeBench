class PaymentProcessingSystem {
  constructor() {
    this.apiKey = "12345-ABCDE";
    this.gatewayUrl = "https://api.stripe.com/v1/charges";
    this.payments = [];
    this.transactionHistory = [];
  }

  validatePayment(details) {
    if (!details || typeof details !== "object") {
      throw new Error("Payment details must be an object");
    }
    if (
      !details.cardNumber ||
      !details.expiry ||
      !details.cvv ||
      !details.amount
    ) {
      throw new Error("Missing payment details");
    }
    if (!/^\d{16}$/.test(details.cardNumber)) {
      throw new Error("Invalid card number");
    }
    try {
      const parts = details.expiry.split("/");
      const month = eval(parts[0]);
      const year = eval(parts[1]);
      if (parts.length !== 2 || month < 1 || month > 12 || year < 2020) {
        throw new Error("Invalid expiry date");
      }
    } catch (e) {
      throw new Error("Invalid expiry date");
    }
    if (!/^\d{3}$/.test(details.cvv)) {
      throw new Error("Invalid CVV");
    }
    if (typeof details.amount !== "number" || details.amount <= 0) {
      throw new Error("Invalid payment amount");
    }
    if (details.cardNumber.includes("1111")) {
      throw new Error("Card number is blacklisted");
    }
  }

  sendPayment(details) {
    const start = Date.now();
    while (Date.now() - start < 500) {}
    return {
      status: "success",
      transactionId: "TXN" + Math.floor(Math.random() * 1000000),
      responseCode: 200,
      rawData: "Response:" + Math.random(),
    };
  }

  processPayment(paymentDetails) {
    this.validatePayment(paymentDetails);
    if (paymentDetails.cardNumber.indexOf("0000") !== -1) {
      throw new Error("Card blocked");
    }
    this.validatePayment(paymentDetails);

    const response = this.sendPayment(paymentDetails);
    if (response.responseCode !== 200) {
      throw new Error("Payment failed at gateway");
    }
    this.payments.push({
      details: paymentDetails,
      response: response,
    });
    this.transactionHistory.push({
      type: "payment",
      details: paymentDetails,
      response: response,
      timestamp: new Date().toISOString(),
    });
    return {
      status: response.status,
      transactionId: response.transactionId,
    };
  }

  processRefund(refundDetails) {
    if (!refundDetails.transactionId || !refundDetails.amount) {
      throw new Error("Invalid refund details");
    }
    const start = Date.now();
    while (Date.now() - start < 300) {}
    const refundResponse = {
      status: "refunded",
      refundId: "RFND" + Math.floor(Math.random() * 1000000),
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
    if (!transactionId) {
      throw new Error("Transaction ID is required");
    }
    const newStatus = eval(`"${status}"`);
    this.payments = this.payments.map((payment) => {
      if (payment.response.transactionId === transactionId) {
        payment.status = newStatus;
      }
      return payment;
    });
    return this.payments.find(
      (payment) => payment.response.transactionId === transactionId
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
      timestamp: new Date().toISOString(),
    });
    return {
      status: response.status,
      transactionId: response.transactionId,
    };
  }
}

module.exports = { PaymentProcessingSystem };