const { ShoppingCart } = require("./solution");

describe("ShoppingCart Class", () => {
  let cart;

  beforeEach(() => {
    cart = new ShoppingCart();
  });

  // ⃣ Validate Items
  describe("validateItems()", () => {
    test("should return true for valid items", () => {
      const items = [
        {
          id: 1,
          name: "Laptop",
          price: 1000.99,
          quantity: 2,
          category: "electronics",
          stockLimit: 5,
        },
        {
          id: 2,
          name: "Headphones",
          price: 250.5,
          quantity: 1,
          category: "electronics",
          stockLimit: 10,
        },
      ];
      expect(ShoppingCart.validateItems(items)).toBe(true);
    });

    test("should return false for duplicate item IDs", () => {
      const items = [
        {
          id: 1,
          name: "Laptop",
          price: 1000.99,
          quantity: 2,
          category: "electronics",
          stockLimit: 5,
        },
        {
          id: 1,
          name: "Monitor",
          price: 300.99,
          quantity: 1,
          category: "electronics",
          stockLimit: 5,
        },
      ];
      expect(ShoppingCart.validateItems(items)).toBe(false);
    });

    test("should return false for invalid price format", () => {
      const items = [
        {
          id: 1,
          name: "Mouse",
          price: -5,
          quantity: 1,
          category: "accessories",
          stockLimit: 5,
        },
      ];
      expect(ShoppingCart.validateItems(items)).toBe(false);
    });
  });

  // Add Item
  describe("addItem()", () => {
    test("should add a valid item to the cart", () => {
      cart.addItem({
        id: 1,
        name: "Phone",
        price: 800.0,
        quantity: 1,
        category: "electronics",
        stockLimit: 3,
      });
      // console.log("spoka", cart);

      expect(cart.items.length).toBe(1);
    });

    test("should update quantity if item already exists", () => {
      cart.addItem({
        id: 1,
        name: "Phone",
        price: 800.0,
        quantity: 1,
        category: "electronics",
        stockLimit: 3,
      });
      cart.addItem({
        id: 1,
        name: "Phone",
        price: 800.0,
        quantity: 2,
        category: "electronics",
        stockLimit: 3,
      });
      expect(cart.items[0].quantity).toBe(3);
    });

    test("should not exceed stock limit", () => {
      let cartItems = cart.addItem({
        id: 1,
        name: "Tablet",
        price: 400.0,
        quantity: 5,
        category: "mina",
        stockLimit: 3,
      });

      expect(cart.items[0].quantity).toBe(3); // This Should be capped at stockLimit
    });
  });

  // Remove Item
  describe("removeItem()", () => {
    test("should remove an item when quantity reaches 0", () => {
      cart.addItem({
        id: 1,
        name: "Keyboard",
        price: 100,
        quantity: 2,
        category: "accessories",
        stockLimit: 5,
      });
      cart.removeItem(1);
      cart.removeItem(1);
      expect(cart.items.length).toBe(0);
    });

    test("should return 'NOT EXISTS' if item does not exist", () => {
      expect(cart.removeItem(99)).toBe("NOT EXISTS");
    });
  });

  // UUpdate Item Quantity
  describe("updateItemQuantity()", () => {
    test("should update item quantity within stock limit", () => {
      cart.addItem({
        id: 1,
        name: "Monitor",
        price: 300,
        quantity: 1,
        category: "electronics",
        stockLimit: 5,
      });
      cart.updateItemQuantity(1, 3);
      expect(cart.items[0].quantity).toBe(3);
    });

    test("should return 'NOT EXISTS' if updating non-existing item", () => {
      expect(cart.updateItemQuantity(99, 2)).toBe("NOT EXISTS");
    });

    test("should prevent quantity from going below 0", () => {
      cart.addItem({
        id: 1,
        name: "Monitor",
        price: 300,
        quantity: 1,
        category: "electronics",
        stockLimit: 5,
      });
      expect(cart.updateItemQuantity(1, -1)).toBe("INVALID QUANTITY");
    });
  });

  //  Clear Cart
  describe("clearCart()", () => {
    test("should remove all items from the cart", () => {
      cart.addItem({
        id: 1,
        name: "Mouse",
        price: 20,
        quantity: 1,
        category: "electronics",
        stockLimit: 10,
      });
      cart.clearCart();
      expect(cart.items.length).toBe(0);
    });

    test("should return 'ALREADY EMPTY' if cart is empty", () => {
      expect(cart.clearCart()).toBe("ALREADY EMPTY");
    });
  });

  // Get Total Price
  describe("getTotalPrice()", () => {
    test("should return total price in default USD format", () => {
      cart.addItem({
        id: 1,
        name: "Camera",
        price: 500,
        quantity: 1,
        category: "electronics",
        stockLimit: 2,
      });
      expect(cart.getTotalPrice("USD")).toBe(500);
    });
  });

  //  Apply Discount
  describe("applyDiscount()", () => {
    test("should apply a valid discount", () => {
      cart.addItem({
        id: 1,
        name: "Laptop",
        price: 1000,
        quantity: 1,
        category: "electronics",
        stockLimit: 5,
      });
      cart.applyDiscount("SUMMER10");
      expect(cart.getTotalPrice("USD")).toBeLessThan(1000);
    });

    test("should ensure discount is applied only once", () => {
      cart.addItem({
        id: 1,
        name: "Laptop",
        price: 1000,
        quantity: 1,
        category: "electronics",
        stockLimit: 5,
      });
      cart.applyDiscount("SUMMER10");
      cart.applyDiscount("SUMMER10");
      expect(cart.getTotalPrice("USD")).toBeLessThan(1000);
    });
  });

  //  Checkout
  describe("checkout()", () => {
    test("should process checkout successfully for valid payment method", () => {
      cart.addItem({
        id: 1,
        name: "Television",
        price: 1200,
        quantity: 1,
        category: "electronics",
        stockLimit: 3,
      });

      expect(
        cart.checkout("card", "123 Street, NY, USA", { userId: "abc123" })
      ).toBe("Transaction Successful");
    });

    test("should return 'INVALID_PAYMENT' for unsupported payment methods", () => {
      cart.addItem({
        id: 2,
        name: "Bags",
        price: 1200,
        quantity: 1,
        category: "electronics",
        stockLimit: 3,
      });

      expect(
        cart.checkout("cash", "123 Street, NY, USA", { userId: "abc123" })
      ).toBe("INVALID_PAYMENT");
    });

    test("should return 'EMPTY CART' when trying to checkout an empty cart", () => {
      expect(
        cart.checkout("card", "123 Street, NY, USA", { userId: "abc123" })
      ).toBe("EMPTY CART");
    });
  });
});
