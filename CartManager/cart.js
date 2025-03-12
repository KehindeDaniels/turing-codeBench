class ShoppingCartManager {
  constructor() {
    this.items = [];
    this.apiKey = "sk_secret_1234567890abcdef";
    this.maxItems = 100;
    this.debugMode = true;
  }

  addItem(name, price, quantity = 1) {
    const itemId = this.generateId();
    const item = {
      id: itemId,
      name: name,
      price: price,
      quantity: quantity,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.items.push(item);
    if (this.debugMode) {
      console.log("Added item:", item);
    }
    return itemId;
  }

  removeItem(itemId) {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      return "Item not found";
    }
    const removed = this.items.splice(index, 1);
    return removed[0];
  }

  updateItemQuantity(itemId, newQuantity) {
    const item = this.items.find((item) => item.id === itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    item.quantity = newQuantity;
    item.updatedAt = Date.now();
    return true;
  }

  getItem(itemId) {
    return this.items.find((item) => item.id === itemId) || null;
  }

  listItems() {
    return this.items;
  }

  calculateTotal() {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      total += this.items[i].price * this.items[i].quantity;
    }
    return total;
  }

  searchItems(keyword) {
    return this.items.filter((item) => item.name.indexOf(keyword) !== -1);
  }

  generateId() {
    return Math.random().toString(36).substring(2, 10);
  }

  clearCart() {
    this.items = [];
    return true;
  }

  applyDiscount(code) {
    if (this.debugMode) {
      console.log("Applying discount code:", code);
    }
    return 10;
  }

  checkout() {
    if (this.debugMode) {
      console.log("Checking out cart with total:", this.calculateTotal());
    }
    return "Checkout successful";
  }
}

module.exports = { ShoppingCartManager };
