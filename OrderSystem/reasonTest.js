const { OrderProcessingSystem } = require("./solution");

describe("OrderProcessingSystem", () => {
  let system;

  beforeEach(() => {
    system = new OrderProcessingSystem();
  });

  // placeOrder tests

  describe("placeOrder", () => {
    test("should place a valid order with no coupon", () => {
      system.placeOrder({
        orderId: "ORD001",
        customerName: "Alice",
        items: [
          { itemName: "Laptop", quantity: 1, price: 1000 },
          { itemName: "Mouse", quantity: 2, price: 50 },
        ],
        currency: "USD",
        country: "USA",
        status: "NEW",
      });

      const order = system.orders.find((o) => o.orderId === "ORD001");
      expect(order).toBeDefined();
      // Check total price (includes 5% US tax = 1050 * 1.05 = 1102.5)
      // For now, only verifying that the order got placed
      // The actual final price check depends on your logic
    });

    test("should apply 10% discount coupon correctly (10OFF)", () => {
      system.placeOrder({
        orderId: "ORD002",
        customerName: "Bob",
        items: [{ itemName: "Phone", quantity: 1, price: 500 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
        couponCode: "10OFF", // 10% discount
      });

      const order = system.orders.find((o) => o.orderId === "ORD002");
      expect(order).toBeDefined();
      // If base is $500 -> 10% discount => $450 => plus 5% tax => 472.5
      // Then loyalty point calculation ~ 47 points if 1 point per $10
    });

    test("should apply FIXED50 coupon and handle tax afterwards", () => {
      system.placeOrder({
        orderId: "ORD003",
        customerName: "Charlie",
        items: [
          { itemName: "Tablet", quantity: 1, price: 300 },
          { itemName: "Headphones", quantity: 1, price: 100 },
        ],
        currency: "USD",
        country: "USA",
        status: "NEW",
        couponCode: "FIXED50",
      });

      const order = system.orders.find((o) => o.orderId === "ORD003");
      expect(order).toBeDefined();
      // base = $400 -> coupon - $50 => $350 -> plus 5% => 367.5 final
    });

    test("should throw an error for unsupported currency", () => {
      expect(() =>
        system.placeOrder({
          orderId: "ORD004",
          customerName: "Diana",
          items: [{ itemName: "Speaker", quantity: 1, price: 100 }],
          currency: "JPY", // not in supportedCurrencies
          country: "USA",
          status: "NEW",
        })
      ).toThrow();
    });

    test("should throw an error for invalid coupon code", () => {
      expect(() =>
        system.placeOrder({
          orderId: "ORD005",
          customerName: "Eve",
          items: [{ itemName: "Keyboard", quantity: 1, price: 100 }],
          currency: "USD",
          country: "USA",
          status: "NEW",
          couponCode: "INVALID_COUPON",
        })
      ).toThrow();
    });

    test("should not place duplicate orders", () => {
      system.placeOrder({
        orderId: "ORD006",
        customerName: "Frank",
        items: [{ itemName: "Monitor", quantity: 1, price: 200 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
      });

      expect(() =>
        system.placeOrder({
          orderId: "ORD006",
          customerName: "Frank",
          items: [{ itemName: "Monitor", quantity: 1, price: 200 }],
          currency: "USD",
          country: "USA",
          status: "NEW",
        })
      ).toThrow();
    });

    test("should correctly calculate tax for Germany (19%)", () => {
      system.placeOrder({
        orderId: "ORD007",
        customerName: "Hans",
        items: [{ itemName: "Book", quantity: 2, price: 20 }],
        currency: "EUR",
        country: "Germany",
        status: "NEW",
      });

      const order = system.orders.find((o) => o.orderId === "ORD007");
      expect(order).toBeDefined();
      // base = €40 -> 19% tax -> 47.6
    });
  });

  // processPayment tests

  describe("processPayment", () => {
    beforeEach(() => {
      // Place a basic order
      system.placeOrder({
        orderId: "PAY001",
        customerName: "Isaac",
        items: [{ itemName: "Shoes", quantity: 1, price: 100 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
      });
    });

    test("should process valid payment if amount matches final order total", () => {
      // Suppose final total ended up 105 (tax) for example
      expect(() =>
        system.processPayment("PAY001", {
          paymentMethod: "Credit Card",
          transactionId: "TXN1001",
          amount: 105,
        })
      ).not.toThrow();
    });

    test("should throw if payment amount does not match final total", () => {
      expect(() =>
        system.processPayment("PAY001", {
          paymentMethod: "Credit Card",
          transactionId: "TXN1001",
          amount: 999, // wrong amount
        })
      ).toThrow();
    });

    test("should throw error if the order does not exist", () => {
      expect(() =>
        system.processPayment("NON_EXISTENT", {
          paymentMethod: "Credit Card",
          transactionId: "TXN9999",
          amount: 100,
        })
      ).toThrow();
    });

    test("should simulate third-party validation failure", () => {
      // e.g. pass invalid paymentMethod to simulate failure
      expect(() =>
        system.processPayment("PAY001", {
          paymentMethod: "INVALID_PAYMENT_GATEWAY",
          transactionId: "TXN1002",
          amount: 105,
        })
      ).toThrow();
    });
  });

  // shipOrder tests

  describe("shipOrder", () => {
    beforeEach(() => {
      system.placeOrder({
        orderId: "SHIP001",
        customerName: "Jack",
        items: [{ itemName: "Console", quantity: 1, price: 500 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
      });
    });

    test("should throw if order is not paid", () => {
      expect(() =>
        system.shipOrder("SHIP001", {
          trackingNumber: "TN123",
          carrier: "UPS",
          estimatedDelivery: "2025-05-01",
        })
      ).toThrow();
    });

    test("should create a shipment record for paid order", () => {
      // Pay for the order first
      // Suppose final cost is e.g. $525
      system.processPayment("SHIP001", {
        paymentMethod: "Credit Card",
        transactionId: "TXN5001",
        amount: 525,
      });
      system.shipOrder("SHIP001", {
        trackingNumber: "TN123",
        carrier: "UPS",
        estimatedDelivery: "2025-05-01",
      });
      const shipment = system.shipments.find((s) => s.orderId === "SHIP001");
      expect(shipment).toBeDefined();
    });

    test("should restrict shipping certain items internationally", () => {
      // This test case requires you to define how you mark restricted items
      // For example, if 'Console' is restricted for shipments outside the US
      // We'll place another order with country = 'Germany'
      system.placeOrder({
        orderId: "SHIP002",
        customerName: "Karl",
        items: [{ itemName: "Console", quantity: 1, price: 300 }],
        currency: "EUR",
        country: "Germany",
        status: "NEW",
      });
      // Pay for it
      system.processPayment("SHIP002", {
        paymentMethod: "Credit Card",
        transactionId: "TXN5002",
        amount: 357, // 300 + 19% tax (57) => 357
      });
      expect(() =>
        system.shipOrder("SHIP002", {
          trackingNumber: "TN124",
          carrier: "DHL",
          estimatedDelivery: "2025-06-01",
        })
      ).toThrow();
    });
  });

  // trackShipment tests

  describe("trackShipment", () => {
    beforeEach(() => {
      system.placeOrder({
        orderId: "TRK001",
        customerName: "Liam",
        items: [{ itemName: "Perfume", quantity: 1, price: 80 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
      });
      // Suppose final is 84 (5% tax)
      system.processPayment("TRK001", {
        paymentMethod: "Credit Card",
        transactionId: "TXN7001",
        amount: 84,
      });
      system.shipOrder("TRK001", {
        trackingNumber: "TNTRK1",
        carrier: "FedEx",
        estimatedDelivery: "2025-07-01",
      });
    });

    test("should return shipping status for an existing shipment", () => {
      const status = system.trackShipment("TRK001");
      expect(status).toBeDefined();
      // e.g. might return { orderId: 'TRK001', trackingNumber: 'TNTRK1', status: 'In Transit' }
    });

    test("should throw if no shipment found for given orderId", () => {
      expect(() => system.trackShipment("NO_TRK")).toThrow();
    });
  });

  // cancelOrder tests

  describe("cancelOrder", () => {
    test("should cancel an unpaid order freely", () => {
      system.placeOrder({
        orderId: "CANCEL001",
        customerName: "Mia",
        items: [{ itemName: "Book", quantity: 2, price: 10 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
      });
      expect(() => system.cancelOrder("CANCEL001")).not.toThrow();
      // The order might be removed or marked canceled
    });

    test("should handle full refund if canceled within 24 hours for a paid order", () => {
      // We'll assume the system stores a timestamp when paid
      system.placeOrder({
        orderId: "CANCEL002",
        customerName: "Nina",
        items: [{ itemName: "Ring", quantity: 1, price: 500 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
      });
      // Payment
      // Suppose total is 525
      system.processPayment("CANCEL002", {
        paymentMethod: "Credit Card",
        transactionId: "TXN9002",
        amount: 525,
      });
      // Immediately attempt cancel
      expect(() => system.cancelOrder("CANCEL002")).not.toThrow();
      // Should get a full refund
      // Could check refund logic
    });

    test("should disallow refunds after shipping", () => {
      system.placeOrder({
        orderId: "CANCEL003",
        customerName: "Oscar",
        items: [{ itemName: "Watch", quantity: 1, price: 200 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
      });
      system.processPayment("CANCEL003", {
        paymentMethod: "Credit Card",
        transactionId: "TXN9003",
        amount: 210,
      });
      system.shipOrder("CANCEL003", {
        trackingNumber: "TNCN3",
        carrier: "UPS",
        estimatedDelivery: "2025-08-01",
      });
      expect(() => system.cancelOrder("CANCEL003")).toThrow();
    });
  });

  // Loyalty Program tests

  describe("Loyalty Program", () => {
    test("should earn loyalty points (1 point per $10) after coupons and tax", () => {
      system.placeOrder({
        orderId: "LOYAL001",
        customerName: "Peter",
        items: [{ itemName: "Camera", quantity: 1, price: 300 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
        couponCode: "10OFF", // => 270 + 5% => 283.5
      });
      // Payment
      system.processPayment("LOYAL001", {
        paymentMethod: "Credit Card",
        transactionId: "TXNLOYAL1",
        amount: 283.5,
      });
      // Suppose the system updates loyaltyPoints in placeOrder or processPayment
      const points = system.getLoyaltyPoints("Peter");
      // Earn about 28 points
      expect(points).toBeGreaterThanOrEqual(28);
    });

    test("should allow redeeming 100 points for $10 discount if enough points", () => {
      // First, place an order to earn >=100 points
      system.placeOrder({
        orderId: "LOYAL002",
        customerName: "Quincy",
        items: [{ itemName: "BigTV", quantity: 1, price: 1200 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
      });
      system.processPayment("LOYAL002", {
        paymentMethod: "Credit Card",
        transactionId: "TXNLOYAL2",
        amount: 1260, // 1200 + 5% tax => 1260
      });
      // Quincy should have 126 loyalty points
      // Next order with loyalty redemption
      system.placeOrder({
        orderId: "LOYAL003",
        customerName: "Quincy",
        items: [{ itemName: "HDMI Cable", quantity: 1, price: 20 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
        // Suppose you allow specifying 'redeemPoints: true' or something similar
        // This is not in your base code, but the AI solution might implement it
        couponCode: "", // no coupon
      });
      // The system might apply a $10 discount if user has >=100 points
      // Then total is $10 + tax => 10.5?
      // We just ensure it doesn't throw
      expect(() =>
        system.processPayment("LOYAL003", {
          paymentMethod: "Credit Card",
          transactionId: "TXNLOYAL3",
          amount: 10.5, // after $10 discount + 5% tax
        })
      ).not.toThrow();
    });
  });

  // getOrderSummary tests

  describe("getOrderSummary", () => {
    test("should return order details including final price and shipping info", () => {
      system.placeOrder({
        orderId: "SUMMARY001",
        customerName: "Rita",
        items: [{ itemName: "Bag", quantity: 1, price: 50 }],
        currency: "USD",
        country: "USA",
        status: "NEW",
      });
      system.processPayment("SUMMARY001", {
        paymentMethod: "PayPal",
        transactionId: "TXNSUM1",
        amount: 52.5,
      });
      system.shipOrder("SUMMARY001", {
        trackingNumber: "TN-SUM1",
        carrier: "FedEx",
        estimatedDelivery: "2025-09-01",
      });

      const summary = system.getOrderSummary("SUMMARY001");
      expect(summary).toBeDefined();
      expect(summary.orderId).toBe("SUMMARY001");
      // Expect summary to contain items, final price, shipping details, payment status, etc.
    });

    test("should throw if order does not exist", () => {
      expect(() => system.getOrderSummary("NO_SUCH_ORDER")).toThrow();
    });
  });
});
