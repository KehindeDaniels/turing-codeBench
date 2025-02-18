class InventoryManager {
  constructor() {
    this.products = [];
    this.supplierOrders = [];
  }

  addProduct(productData) {
    if (this.products.find((product) => product.name === productData.name)) {
      throw new Error(`Product '${productData.name}' already exists.`);
    }

    if (
      productData.price < 0 ||
      productData.restockThreshold < 0 ||
      productData.autoReorderQuantity < 0
    ) {
      throw new Error(
        "price, restockThreshold, and autoReorderQuantity must be ≥ 0."
      );
    }

    if (productData.warehouses) {
      Object.keys(productData.warehouses).forEach((warehouseName) => {
        if (typeof warehouseName !== "string") {
          throw new Error("Warehouse names must be strings.");
        }

        productData.warehouses[warehouseName].forEach((batch) => {
          if (batch.quantity < 0) {
            throw new Error("Batch quantity must be ≥ 0.");
          }

          if (new Date(batch.expiryDate) < new Date()) {
            throw new Error(
              `Cannot add expired batch. Expiry date: ${batch.expiryDate}`
            );
          }
        });
      });
    }

    this.products.push(productData);
  }

  addProductBatch(productName, warehouseName, batchInfo) {
    const product = this.products.find(
      (product) => product.name === productName
    );

    if (!product) {
      throw new Error(`Product '${productName}' does not exist.`);
    }

    if (!product.warehouses) {
      product.warehouses = {};
    }

    if (!product.warehouses[warehouseName]) {
      product.warehouses[warehouseName] = [];
    }

    if (
      product.warehouses[warehouseName].find(
        (batch) => batch.batchId === batchInfo.batchId
      )
    ) {
      throw new Error(
        `Batch '${batchInfo.batchId}' already exists in warehouse '${warehouseName}'.`
      );
    }

    if (batchInfo.quantity < 0) {
      throw new Error("Batch quantity must be ≥ 0.");
    }

    if (new Date(batchInfo.expiryDate) < new Date()) {
      throw new Error(
        `Cannot add expired batch. Expiry date: ${batchInfo.expiryDate}`
      );
    }

    product.warehouses[warehouseName].push(batchInfo);
  }

  sellItems(productName, warehouseName, quantity) {
    const product = this.products.find(
      (product) => product.name === productName
    );

    if (!product) {
      throw new Error(`Product '${productName}' does not exist.`);
    }

    if (!product.warehouses || !product.warehouses[warehouseName]) {
      throw new Error(
        `Warehouse '${warehouseName}' does not exist for product '${productName}'.`
      );
    }

    const batches = product.warehouses[warehouseName].filter(
      (batch) => new Date(batch.expiryDate) >= new Date()
    );

    if (
      batches.reduce((total, batch) => total + batch.quantity, 0) < quantity
    ) {
      throw new Error(
        `Insufficient stock in '${warehouseName}'. Requested: ${quantity}, Available: ${batches.reduce(
          (total, batch) => total + batch.quantity,
          0
        )}`
      );
    }

    batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    let remainingQuantity = quantity;

    for (const batch of batches) {
      if (batch.quantity <= remainingQuantity) {
        remainingQuantity -= batch.quantity;
        batch.quantity = 0;
      } else {
        batch.quantity -= remainingQuantity;
        remainingQuantity = 0;
      }

      if (remainingQuantity === 0) {
        break;
      }
    }

    if (this.getStock(productName) < product.restockThreshold) {
      this.autoRestock(productName);
    }
  }

  autoRestock(productName) {
    const product = this.products.find(
      (product) => product.name === productName
    );

    if (!product) {
      throw new Error(`Product '${productName}' does not exist.`);
    }

    this.supplierOrders.push({
      productName,
      quantityOrdered: product.autoReorderQuantity,
      orderDate: new Date().toISOString().split("T")[0],
      estimatedArrival: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });
  }

  receiveDelivery(productName, warehouseName, shipmentDetails) {
    const product = this.products.find(
      (product) => product.name === productName
    );

    if (!product) {
      throw new Error(`Product '${productName}' does not exist.`);
    }

    if (!product.warehouses) {
      product.warehouses = {};
    }

    if (!product.warehouses[warehouseName]) {
      product.warehouses[warehouseName] = [];
    }

    product.warehouses[warehouseName].push(shipmentDetails);
  }

  removeExpiredBatches() {
    this.products.forEach((product) => {
      if (product.warehouses) {
        Object.keys(product.warehouses).forEach((warehouseName) => {
          product.warehouses[warehouseName] = product.warehouses[
            warehouseName
          ].filter((batch) => new Date(batch.expiryDate) >= new Date());
        });
      }
    });
  }

  getStock(productName) {
    const product = this.products.find(
      (product) => product.name === productName
    );

    if (!product) {
      throw new Error(`Product '${productName}' does not exist.`);
    }

    if (!product.warehouses) {
      return 0;
    }

    return Object.keys(product.warehouses).reduce((total, warehouseName) => {
      return (
        total +
        product.warehouses[warehouseName]
          .filter((batch) => new Date(batch.expiryDate) >= new Date())
          .reduce((warehouseTotal, batch) => warehouseTotal + batch.quantity, 0)
      );
    }, 0);
  }

  getInventoryValue() {
    return this.products.reduce((total, product) => {
      return total + product.price * this.getStock(product.name);
    }, 0);
  }

  getLowStockItems() {
    return this.products
      .filter(
        (product) => this.getStock(product.name) < product.restockThreshold
      )
      .map((product) => product.name);
  }
}

module.exports = { InventoryManager };
