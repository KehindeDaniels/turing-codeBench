class OrderProcessingSystem {
  constructor() {
    this.orders = [];
    this.shipments = [];
    this.loyaltyPoints = {}; 
    this.supportedCurrencies = ["USD", "EUR", "NGN"];
    this.taxRates = { USA: 0.05, Germany: 0.19, Nigeria: 0.075 };
    this.coupons = { "10OFF": 0.1, FIXED50: 50 };
    this.exchangeRates = { USD: 1, EUR: 0.85, NGN: 410 };
  }

  placeOrder(orderData) {
    // Prevent duplicate orders
    if (this.orders.find((o) => o.orderId === orderData.orderId)) {
      throw new Error("Duplicate order");
    }

    // Validate required fields
    if (
      !orderData.orderId ||
      !orderData.customerName ||
      !orderData.items ||
      !orderData.currency ||
      !orderData.country ||
      !orderData.status
    ) {
      throw new Error("Missing required order fields");
    }

    // Validate supported currency
    if (!this.supportedCurrencies.includes(orderData.currency)) {
      throw new Error("Unsupported currency");
    }

    // Validate coupon if provided (non-empty string)
    const couponCode = orderData.couponCode;
    if (couponCode && couponCode !== "") {
      if (!this.coupons.hasOwnProperty(couponCode)) {
        throw new Error("Invalid coupon code");
      }
    }

    // Calculate subtotal in USD from items (assume item prices are in USD)
    let subtotalUSD = 0;
    for (let item of orderData.items) {
      subtotalUSD += item.price * item.quantity;
    }

    // Convert subtotal to order currency
    const conversionRate = this.exchangeRates[orderData.currency];
    let subtotal = subtotalUSD * conversionRate;

    // Initialize discount values
    let couponDiscount = 0;
    if (couponCode && couponCode !== "") {
      const discountVal = this.coupons[couponCode];
      if (couponCode === "10OFF") {
        couponDiscount = subtotal * discountVal;
      } else if (couponCode === "FIXED50") {
        // FIXED50 coupon gives a fixed discount of $50 converted to order currency
        couponDiscount = 50 * conversionRate;
      }
    }

    // Check for loyalty redemption – if the customer has at least 100 points, automatically apply a $10 discount.
    const customer = orderData.customerName;
    let loyaltyDiscount = 0;
    if ((this.loyaltyPoints[customer] || 0) >= 100) {
      loyaltyDiscount = 10 * conversionRate;
      this.loyaltyPoints[customer] = (this.loyaltyPoints[customer] || 0) - 100;
    }

    // Compute discounted subtotal; ensure it is not negative.
    let discountedSubtotal = subtotal - couponDiscount - loyaltyDiscount;
    if (discountedSubtotal < 0) {
      discountedSubtotal = 0;
    }

    // tax rate based on country
    const taxRate = this.taxRates[orderData.country];
    if (taxRate === undefined) {
      throw new Error("Unsupported country for tax calculation");
    }
    let tax = discountedSubtotal * taxRate;

    // Final total after discount and tax
    let finalTotal = discountedSubtotal + tax;
    finalTotal = Number(finalTotal.toFixed(2));

    //  the order object 
    const order = {
      ...orderData,
      subtotal: Number(subtotal.toFixed(2)),
      couponDiscount: Number(couponDiscount.toFixed(2)),
      loyaltyDiscount: Number(loyaltyDiscount.toFixed(2)),
      discountedSubtotal: Number(discountedSubtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      finalTotal,
      createdAt: new Date(),
      paymentTimestamp: null,
      paymentInfo: null,
      refundAmount: 0,
    };

    this.orders.push(order);
  }

  processPayment(orderId, paymentInfo) {
    // Find the order
    const order = this.orders.find((o) => o.orderId === orderId);
    if (!order) throw new Error("Order does not exist");

    // Validate payment method (only Credit Card or PayPal allowed)
    if (!["Credit Card", "PayPal"].includes(paymentInfo.paymentMethod)) {
      throw new Error("Invalid payment method");
    }
    // Simulate third-party validation failure if paymentMethod is "INVALID_PAYMENT_GATEWAY"
    if (paymentInfo.paymentMethod === "INVALID_PAYMENT_GATEWAY") {
      throw new Error("Payment validation failed");
    }

    // Validate that the payment amount matches the final order total
    if (Number(paymentInfo.amount.toFixed(2)) !== order.finalTotal) {
      throw new Error("Payment amount does not match order total");
    }

    // Update order with payment details
    order.status = "PAID";
    order.paymentTimestamp = new Date();
    order.paymentInfo = paymentInfo;

    // Award loyalty points based on spending.
    // Points: 1 point for every $10 spent (in USD). Convert finalTotal back to USD.
    const conversionRate = this.exchangeRates[order.currency];
    const finalTotalInUSD = order.finalTotal / conversionRate;
    const pointsEarned = Math.floor(finalTotalInUSD / 10);

    const customer = order.customerName;
    if (!this.loyaltyPoints[customer]) {
      this.loyaltyPoints[customer] = 0;
    }
    this.loyaltyPoints[customer] += pointsEarned;
  }

  shipOrder(orderId, shippingDetails) {
    // Find the order
    const order = this.orders.find((o) => o.orderId === orderId);
    if (!order) throw new Error("Order does not exist");

    // Orders can only be shipped if their status is PAID
    if (order.status !== "PAID") {
      throw new Error("Order is not paid");
    }

    // Restricted items
    const restrictedItems = ["Console", "Batteries", "Chemicals", "Flammables"];
    if (order.country !== "USA") {
      for (let item of order.items) {
        if (restrictedItems.includes(item.itemName)) {
          throw new Error("Restricted item cannot be shipped internationally");
        }
      }
    }

    // Create a shipment record and update order status
    const shipment = {
      orderId: order.orderId,
      trackingNumber: shippingDetails.trackingNumber,
      carrier: shippingDetails.carrier,
      estimatedDelivery: shippingDetails.estimatedDelivery,
      status: "In Transit",
    };
    this.shipments.push(shipment);
    order.status = "SHIPPED";
  }

  trackShipment(orderId) {
    const shipment = this.shipments.find((s) => s.orderId === orderId);
    if (!shipment) throw new Error("No shipment found for given orderId");
    return shipment;
  }

  cancelOrder(orderId) {
    const order = this.orders.find((o) => o.orderId === orderId);
    if (!order) throw new Error("Order does not exist");

    // Cannot cancel if order is already shipped
    if (order.status === "SHIPPED") {
      throw new Error("Cannot cancel order that has been shipped");
    }

    // If order is NEW (unpaid), cancel freely
    if (order.status === "NEW") {
      order.status = "CANCELED";
      return;
    }

    // Full refund if canceled within 24 hours of payment; 50% refund if after 24 hours (but before shipping).
    if (order.status === "PAID") {
      const now = new Date();
      const paidTime = order.paymentTimestamp;
      const diffHours = (now - paidTime) / (1000 * 60 * 60);
      let refundAmount = 0;
      if (diffHours <= 24) {
        refundAmount = order.finalTotal;
      } else {
        refundAmount = order.finalTotal * 0.5;
      }
      order.refundAmount = Number(refundAmount.toFixed(2));
      order.status = "CANCELED";
      return;
    }
  }

  applyLoyaltyPoints(customerName, amountSpent) {
    // Utility method: Award loyalty points based on amount spent.
    const pointsEarned = Math.floor(amountSpent / 10);
    if (!this.loyaltyPoints[customerName]) {
      this.loyaltyPoints[customerName] = 0;
    }
    this.loyaltyPoints[customerName] += pointsEarned;
  }

  getOrderSummary(orderId) {
    const order = this.orders.find((o) => o.orderId === orderId);
    if (!order) throw new Error("Order does not exist");

    const shipment = this.shipments.find((s) => s.orderId === orderId) || null;
    return {
      orderId: order.orderId,
      customerName: order.customerName,
      items: order.items,
      currency: order.currency,
      country: order.country,
      status: order.status,
      subtotal: order.subtotal,
      couponDiscount: order.couponDiscount,
      loyaltyDiscount: order.loyaltyDiscount,
      discountedSubtotal: order.discountedSubtotal,
      tax: order.tax,
      finalTotal: order.finalTotal,
      paymentInfo: order.paymentInfo,
      shipment,
      refundAmount: order.refundAmount || 0,
    };
  }

  getLoyaltyPoints(customerName) {
    return this.loyaltyPoints[customerName] || 0;
  }
}

module.exports = { OrderProcessingSystem };
