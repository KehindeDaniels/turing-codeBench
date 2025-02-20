class ShoppingCart {
  constructor() {
    this.items = [];
    this.appliedDiscount = null;
    this.cartCreatedAt = new Date();
  }

  static validateItems(items) {
    if (!Array.isArray(items)) return false;

    const idSet = new Set(); // Used to track duplicate IDs
    for (const item of items) {
      if (typeof item.id !== "number" && typeof item.id !== "string")
        return false;
      if (idSet.has(item.id)) return false;
      idSet.add(item.id);

      if (typeof item.name !== "string" || item.name.length < 3) return false;
      if (
        typeof item.price !== "number" ||
        item.price <= 0 ||
        Number(item.price.toFixed(2)) !== item.price
      )
        return false;
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) return false;
      if (typeof item.category !== "string") return false;
      if (typeof item.stockLimit !== "number" || item.stockLimit <= 0)
        return false;
    }

    return true;
  }

  addItem(item) {
    if (!ShoppingCart.validateItems([item])) return;

    const existingItem = this.items.find((i) => i.id === item.id);
    if (existingItem) {
      existingItem.quantity = Math.min(
        existingItem.quantity + item.quantity,
        existingItem.stockLimit
      );
    } else {
      item.quantity = Math.min(item.quantity, item.stockLimit);
      this.items.push(item);
    }

    return this.items;
  }

  removeItem(itemId) {
    const itemIndex = this.items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return "NOT EXISTS";

    if (this.items[itemIndex].quantity > 1) {
      this.items[itemIndex].quantity--;
    } else {
      this.items.splice(itemIndex, 1);
    }

    return this.items;
  }

  updateItemQuantity(itemId, quantity) {
    const itemIndex = this.items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return "NOT EXISTS";

    if (quantity < 0) return "INVALID QUANTITY";

    this.items[itemIndex].quantity = Math.min(
      quantity,
      this.items[itemIndex].stockLimit
    );

    if (this.items[itemIndex].quantity === 0) {
      this.removeItem(itemId);
    }

    return this.items;
  }

  clearCart() {
    if (this.items.length === 0) return "ALREADY EMPTY";

    this.items = [];
    this.appliedDiscount = null;

    return this.items;
  }

  getTotalPrice(currency, includeTax = false) {
    if (this.items.length === 0) return 0;

    let totalPrice = this.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    if (this.appliedDiscount) {
      totalPrice *= 1 - this.appliedDiscount / 100;
    }

    if (includeTax) {
      const taxRates = {
        USD: 0.075,
        EUR: 0.2,
        GBP: 0.19,
      };
      totalPrice *= 1 + (taxRates[currency] || 0);
    }

    return parseFloat(totalPrice.toFixed(2));
  }

  // Applying Discount
  applyDiscount(code) {
    if (this.appliedDiscount) return; // Preventing multiple applications

    const discountCodes = {
      SUMMER10: 10,
    };

    if (discountCodes[code.toUpperCase()]) {
      this.appliedDiscount = discountCodes[code.toUpperCase()];
    }
  }

  // Checkout
  checkout(paymentMethod, shippingAddress, userAccount) {
    if (this.items.length === 0) return "EMPTY CART";

    if (paymentMethod !== "card" && paymentMethod !== "crypto")
      return "INVALID_PAYMENT";

    this.clearCart();

    return "Transaction Successful";
  }
}

module.exports = { ShoppingCart };
