const { OrderProcessingSystem } = require("./solution");

describe("OrderProcessingSystem", () => {
  let system;

  beforeEach(() => {
    system = new OrderProcessingSystem();
  });

  describe("placeOrder", () => {
    test("should successfully place a valid order", () => {
      expect(() =>
        system.placeOrder({
          orderId: "ORD001",
          customerName: "Alice",
          items: [
            { itemName: "Laptop", quantity: 1, price: 1000 },
            { itemName: "Mouse", quantity: 2, price: 50 },
          ],
          currency: "USD",
          country: "USA",
          couponCode: "10OFF",
        })
      ).not.toThrow();
    });

    test("should throw an error for unsupported currency", () => {
      expect(() =>
        system.placeOrder({
          orderId: "ORD002",
          customerName: "Bob",
          items: [{ itemName: "Keyboard", quantity: 1, price: 100 }],
          currency: "INR",
          country: "USA",
        })
      ).toThrow();
    });

    test("should apply coupon discounts correctly", () => {
      system.placeOrder({
        orderId: "ORD003",
        customerName: "Charlie",
        items: [{ itemName: "Tablet", quantity: 1, price: 500 }],
        currency: "USD",
        country: "USA",
        couponCode: "10OFF",
      });
      const order = system.orders.find((o) => o.orderId === "ORD003");
      expect(order.totalPrice).toBe(500 * 0.9 * 1.05); // 10% discount + 5% tax
    });
  });

  describe("processPayment", () => {
    beforeEach(() => {
      system.placeOrder({
        orderId: "ORD004",
        customerName: "Dave",
        items: [{ itemName: "Monitor", quantity: 1, price: 300 }],
        currency: "USD",
        country: "USA",
      });
    });

    test("should accept valid payment", () => {
      expect(() =>
        system.processPayment("ORD004", {
          paymentMethod: "Credit Card",
          transactionId: "TXN1001",
          amount: 300 * 1.05,
        })
      ).not.toThrow();
    });

    test("should reject incorrect payment amount", () => {
      expect(() =>
        system.processPayment("ORD004", {
          paymentMethod: "Credit Card",
          transactionId: "TXN1002",
          amount: 200,
        })
      ).toThrow();
    });
  });

  describe("shipOrder", () => {
    beforeEach(() => {
      system.placeOrder({
        orderId: "ORD005",
        customerName: "Eve",
        items: [{ itemName: "Headphones", quantity: 1, price: 150 }],
        currency: "USD",
        country: "USA",
      });
      system.processPayment("ORD005", {
        paymentMethod: "PayPal",
        transactionId: "TXN1003",
        amount: 150 * 1.05,
      });
    });

    test("should successfully ship a paid order", () => {
      expect(() =>
        system.shipOrder("ORD005", {
          trackingNumber: "TRK12345",
          carrier: "FedEx",
          estimatedDelivery: "2025-06-01",
        })
      ).not.toThrow();
    });

    test("should not ship an unpaid order", () => {
      expect(() =>
        system.shipOrder("ORD006", {
          trackingNumber: "TRK54321",
          carrier: "UPS",
          estimatedDelivery: "2025-06-01",
        })
      ).toThrow();
    });
  });

  describe("cancelOrder", () => {
    beforeEach(() => {
      system.placeOrder({
        orderId: "ORD007",
        customerName: "Frank",
        items: [{ itemName: "Smartphone", quantity: 1, price: 800 }],
        currency: "USD",
        country: "USA",
      });
    });

    test("should allow cancellation of unpaid orders", () => {
      expect(() => system.cancelOrder("ORD007")).not.toThrow();
    });

    test("should enforce refund policy on paid orders", () => {
      system.processPayment("ORD007", {
        paymentMethod: "Credit Card",
        transactionId: "TXN1004",
        amount: 800 * 1.05,
      });
      expect(() => system.cancelOrder("ORD007")).toThrow();
    });
  });

  describe("Loyalty Points", () => {
    test("should accumulate loyalty points correctly", () => {
      system.placeOrder({
        orderId: "ORD008",
        customerName: "Grace",
        items: [{ itemName: "TV", quantity: 1, price: 1000 }],
        currency: "USD",
        country: "USA",
      });
      system.processPayment("ORD008", {
        paymentMethod: "Credit Card",
        transactionId: "TXN1005",
        amount: 1000 * 1.05,
      });
      expect(system.getLoyaltyPoints("Grace")).toBe(100); // $1000 => 100 points
    });

    test("should redeem loyalty points for discounts correctly", () => {
      system.loyaltyPoints["Grace"] = 200;
      system.placeOrder({
        orderId: "ORD009",
        customerName: "Grace",
        items: [{ itemName: "Speaker", quantity: 1, price: 200 }],
        currency: "USD",
        country: "USA",
      });
      system.applyLoyaltyPoints("Grace", 100); // 100 points = $10 discount
      const order = system.orders.find((o) => o.orderId === "ORD009");
      expect(order.totalPrice).toBe((200 - 10) * 1.05);
    });
  });
});
