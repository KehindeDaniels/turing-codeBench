class InventoryManager {
  constructor() {
    this.products = {};
    this.supplierOrders = [];
  }

  // Adding Products
  addProduct(productData) {
    if (this.products[productData.name]) {
      throw new Error(`Product '${productData.name}' already exists.`);
    }

    if (
      productData.price < 0 ||
      productData.restockThreshold < 0 ||
      productData.autoReorderQuantity < 0
    ) {
      throw new Error(
        "Price, restockThreshold, and autoReorderQuantity must be ≥ 0."
      );
    }

    this.products[productData.name] = {
      ...productData,
      warehouses: productData.warehouses || {},
    };
  }

  // Adding product batches
  addProductBatch(productName, warehouseName, batchInfo) {
    if (!this.products[productName]) {
      throw new Error(`Product '${productName}' does not exist.`);
    }

    if (batchInfo.quantity < 0) {
      throw new Error("Batch quantity must be ≥ 0.");
    }

    const expiryDate = new Date(batchInfo.expiryDate);
    if (expiryDate < new Date()) {
      throw new Error(
        `Cannot add expired batch. Expiry date: ${batchInfo.expiryDate}`
      );
    }

    if (!this.products[productName].warehouses[warehouseName]) {
      this.products[productName].warehouses[warehouseName] = [];
    }

    const existingBatch = this.products[productName].warehouses[
      warehouseName
    ].find((batch) => batch.batchId === batchInfo.batchId);
    if (existingBatch) {
      throw new Error(
        `Batch '${batchInfo.batchId}' already exists in warehouse '${warehouseName}'.`
      );
    }

    this.products[productName].warehouses[warehouseName].push(batchInfo);
  }

  // selling in fifo order
  sellItems(productName, warehouseName, quantity) {
    if (!this.products[productName]) {
      throw new Error(`Product '${productName}' does not exist.`);
    }

    if (!this.products[productName].warehouses[warehouseName]) {
      throw new Error(
        `Warehouse '${warehouseName}' does not exist for product '${productName}'.`
      );
    }

    // Getting all batches in the warehouse
    const allBatches = this.products[productName].warehouses[warehouseName];

    // use only valid (non-expired) batches for selling
    const validBatches = allBatches.filter(
      (batch) => new Date(batch.expiryDate) >= new Date()
    );
    validBatches.sort(
      (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
    );

    let remainingQuantity = quantity;
    for (const batch of validBatches) {
      if (batch.quantity >= remainingQuantity) {
        batch.quantity -= remainingQuantity;
        remainingQuantity = 0;
        break;
      } else {
        remainingQuantity -= batch.quantity;
        batch.quantity = 0;
      }
    }

    if (remainingQuantity > 0) {
      const availableQuantity = validBatches.reduce(
        (acc, batch) => acc + batch.quantity,
        0
      );
      throw new Error(
        `Insufficient stock in '${warehouseName}'. Requested: ${quantity}, Available: ${availableQuantity}`
      );
    }

    // Preserve any expired batches (unsold) by combining them with our updated valid batches
    const expiredBatches = allBatches.filter(
      (batch) => new Date(batch.expiryDate) < new Date()
    );
    const updatedValidBatches = validBatches.filter(
      (batch) => batch.quantity > 0
    );
    this.products[productName].warehouses[warehouseName] = [
      ...updatedValidBatches,
      ...expiredBatches,
    ];

    // Auto-restock if the total stock (across all warehouses) is below threshold.
    const totalStock = this.getStock(productName);
    if (totalStock < this.products[productName].restockThreshold) {
      this.autoRestock(productName);
    }
  }

  // 4. Auto-restocking
  autoRestock(productName) {
    if (!this.products[productName]) {
      throw new Error(`Product '${productName}' does not exist.`);
    }

    const totalStock = this.getStock(productName);
    if (totalStock >= this.products[productName].restockThreshold) {
      return; // there's no need to restock here
    }

    const orderDate = new Date().toISOString().split("T")[0];
    const estimatedArrival = new Date();
    estimatedArrival.setDate(estimatedArrival.getDate() + 3);

    this.supplierOrders.push({
      productName,
      quantityOrdered: this.products[productName].autoReorderQuantity,
      orderDate,
      estimatedArrival: estimatedArrival.toISOString().split("T")[0],
    });
  }

  // Receveing deliveries
  receiveDelivery(productName, warehouseName, shipmentDetails) {
    if (!this.products[productName]) {
      throw new Error(`Product '${productName}' does not exist.`);
    }

    this.addProductBatch(productName, warehouseName, shipmentDetails);
  }

  // 6. removiing expired batches
  removeExpiredBatches() {
    for (const productName in this.products) {
      for (const warehouse in this.products[productName].warehouses) {
        this.products[productName].warehouses[warehouse] = this.products[
          productName
        ].warehouses[warehouse].filter(
          (batch) => new Date(batch.expiryDate) >= new Date()
        );
      }
    }
  }

  // Getting the total stock
  // Sums all batches (including expired ones) so that before removing expired batches,
  // the total matches the test expectations.
  getStock(productName) {
    if (!this.products[productName]) {
      throw new Error(`Product '${productName}' does not exist.`);
    }

    let totalStock = 0;
    for (const warehouse in this.products[productName].warehouses) {
      totalStock += this.products[productName].warehouses[warehouse].reduce(
        (acc, batch) => acc + batch.quantity,
        0
      );
    }
    return totalStock;
  }

  // Getting the inventory value
  getInventoryValue() {
    let totalValue = 0;
    for (const productName in this.products) {
      totalValue +=
        this.products[productName].price * this.getStock(productName);
    }
    return totalValue;
  }

  // Getting low stock items
  getLowStockItems() {
    return Object.keys(this.products).filter((productName) => {
      return (
        this.getStock(productName) < this.products[productName].restockThreshold
      );
    });
  }
}

module.exports = { InventoryManager };
