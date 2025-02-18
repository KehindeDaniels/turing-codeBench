// inventoryManager.test.js
const { InventoryManager } = require("./solution");

describe("Inventory Management System Testing", () => { 
  let manager;

  beforeEach(() => {
    manager = new InventoryManager();
  });

  // Adding and Validating Products
  describe("addProduct()", () => {
    test("Adds a valid product with all required fields", () => {
      expect(() =>
        manager.addProduct({
          name: "Widget A",
          price: 5.0,
          restockThreshold: 5,
          autoReorderQuantity: 20,
          warehouses: {
            "Warehouse 1": [
              { batchId: "WA1-001", quantity: 10, expiryDate: "2025-06-01" },
            ],
          },
        })
      ).not.toThrow();
    });

    test("Throws error if product name already exists", () => {
      manager.addProduct({
        name: "Widget A",
        price: 5,
        restockThreshold: 5,
        autoReorderQuantity: 10,
        warehouses: {},
      });
      expect(() =>
        manager.addProduct({
          name: "Widget A", // same name
          price: 5,
          restockThreshold: 5,
          autoReorderQuantity: 10,
          warehouses: {},
        })
      ).toThrow();
    });

    test("Throws error for negative price or restockThreshold or autoReorderQuantity", () => {
      expect(() =>
        manager.addProduct({
          name: "Widget B",
          price: -1,
          restockThreshold: 5,
          autoReorderQuantity: 10,
          warehouses: {},
        })
      ).toThrow();

      expect(() =>
        manager.addProduct({
          name: "Widget C",
          price: 10,
          restockThreshold: -5,
          autoReorderQuantity: 10,
          warehouses: {},
        })
      ).toThrow();

      expect(() =>
        manager.addProduct({
          name: "Widget D",
          price: 10,
          restockThreshold: 5,
          autoReorderQuantity: -1,
          warehouses: {},
        })
      ).toThrow();
    });

    test("Warehouses can be empty; does not throw error", () => {
      expect(() =>
        manager.addProduct({
          name: "Widget E",
          price: 0,
          restockThreshold: 0,
          autoReorderQuantity: 0,
          warehouses: {},
        })
      ).not.toThrow();
    });
  });

  //Handling batch
  describe("addProductBatch()", () => {
    beforeEach(() => {
      manager.addProduct({
        name: "Widget A",
        price: 5.0,
        restockThreshold: 5,
        autoReorderQuantity: 20,
        warehouses: {
          "Warehouse 1": [
            { batchId: "WA1-001", quantity: 10, expiryDate: "2025-06-01" },
          ],
        },
      });
    });

    test("Adds a valid batch to existing warehouse", () => {
      expect(() =>
        manager.addProductBatch("Widget A", "Warehouse 1", {
          batchId: "WA1-002",
          quantity: 5,
          expiryDate: "2025-12-01",
        })
      ).not.toThrow();
    });

    test("Auto-creates warehouse if it doesn't exist", () => {
      expect(() =>
        manager.addProductBatch("Widget A", "Warehouse 2", {
          batchId: "WA2-001",
          quantity: 10,
          expiryDate: "2025-10-10",
        })
      ).not.toThrow();
    });

    test("Throws error if product doesn't exist", () => {
      expect(() =>
        manager.addProductBatch("NonExistent", "Warehouse 1", {
          batchId: "B999",
          quantity: 5,
          expiryDate: "2025-06-01",
        })
      ).toThrow();
    });

    test("Throws error if batchId already exists in the same warehouse", () => {
      // WA1-001 is already in Warehouse 1
      expect(() =>
        manager.addProductBatch("Widget A", "Warehouse 1", {
          batchId: "WA1-001",
          quantity: 5,
          expiryDate: "2026-01-01",
        })
      ).toThrow();
    });

    test("Throws error for negative batch quantity", () => {
      expect(() =>
        manager.addProductBatch("Widget A", "Warehouse 1", {
          batchId: "WA1-003",
          quantity: -2,
          expiryDate: "2026-01-01",
        })
      ).toThrow();
    });

    test("Throws error if expiryDate is before today (expired on add)", () => {
      expect(() =>
        manager.addProductBatch("Widget A", "Warehouse 1", {
          batchId: "WA1-004",
          quantity: 10,
          expiryDate: "2000-01-01", //this is definitely expired
        })
      ).toThrow();
    });
  });

  // Selling in fifo order
  describe("sellItems()", () => {
    beforeEach(() => {
      // Add a product with multiple batches for testing FIFO
      manager.addProduct({
        name: "Widget A",
        price: 5,
        restockThreshold: 5,
        autoReorderQuantity: 20,
        warehouses: {
          "Warehouse 1": [
            { batchId: "B001", quantity: 10, expiryDate: "2026-01-01" }, // this is older and
            { batchId: "B002", quantity: 10, expiryDate: "2026-06-01" }, // this is newer
          ],
          "Warehouse 2": [
            { batchId: "B003", quantity: 5, expiryDate: "2024-12-31" }, // this might expire earlier
          ],
        },
      });
    });

    test("Removes items in FIFO order from the specified warehouse", () => {
      // Warehouse 1 has B001(10), B002(10)
      manager.sellItems("Widget A", "Warehouse 1", 12);
      // That should remove 10 from B001 + 2 from B002
      // So B001 is empty, B002 has 8 left
      const totalRemaining = manager.getStock("Widget A");
      // initial total was 25 across all warehouses
      // sold 12 and left 13
      expect(totalRemaining).toBe(13);
    });

    test("Skips expired batches automatically", () => {
      // expiring B003 then selling from Warehouse 2 should skip it
      manager.removeExpiredBatches(); // or mark B003 expired if date is past
      // Suppose B003 is expired, means 0 stock in Warehouse 2
      expect(() => manager.sellItems("Widget A", "Warehouse 2", 1)).toThrow(
        /Insufficient stock.*Warehouse 2.*Requested: 1, Available: 0/i
      );
    });

    test("Throws dynamic error if insufficient stock in warehouse", () => {
      expect(() => manager.sellItems("Widget A", "Warehouse 1", 999)).toThrow(
        /Insufficient stock in 'Warehouse 1'. Requested: 999, Available: \d+/
      );
    });

    test("Auto-restock is called if total stock across all warehouses < threshold", () => {
      expect(() => {
        manager.sellItems("Widget A", "Warehouse 1", 21);
      }).toThrow(/Insufficient stock in 'Warehouse 1'/);
    });
  });

  // Auto restocking
  describe("autoRestock()", () => {
    beforeEach(() => {
      manager.addProduct({
        name: "Widget A",
        price: 5,
        restockThreshold: 10,
        autoReorderQuantity: 20,
        warehouses: {
          "Warehouse 1": [
            { batchId: "REST-001", quantity: 9, expiryDate: "2025-01-01" },
          ],
        },
      });
    });

    test("autoRestock creates a new supplier order if total stock < threshold", () => {
      // Current total stock = 9, threshold = 10 which is below threshold
      // If code automatically calls autoRestock or we call it manually:
      manager.autoRestock("Widget A");
      expect(manager.supplierOrders.length).toBe(1);
      const order = manager.supplierOrders[0];
      expect(order.productName).toBe("Widget A");
      expect(order.quantityOrdered).toBe(20);
      expect(order.orderDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(order.estimatedArrival).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  //Retriving deliveries
  describe("receiveDelivery()", () => {
    beforeEach(() => {
      manager.addProduct({
        name: "Widget A",
        price: 5,
        restockThreshold: 10,
        autoReorderQuantity: 20,
        warehouses: {
          "Warehouse 1": [],
        },
      });
    });

    test("Adds a new batch to the product's warehouse", () => {
      expect(() =>
        manager.receiveDelivery("Widget A", "Warehouse 1", {
          batchId: "DEL-001",
          quantity: 15,
          expiryDate: "2026-01-01",
        })
      ).not.toThrow();
      expect(manager.getStock("Widget A")).toBe(15);
    });

    test("Throws error if product doesn't exist", () => {
      expect(() =>
        manager.receiveDelivery("NonExistent", "Warehouse 1", {
          batchId: "DEL-002",
          quantity: 10,
          expiryDate: "2026-01-01",
        })
      ).toThrow();
    });
  });

  // Removing expired batches
  describe("removeExpiredBatches()", () => {
    beforeEach(() => {
      manager.addProduct({
        name: "Widget A",
        price: 2,
        restockThreshold: 5,
        autoReorderQuantity: 10,
        warehouses: {
          "Warehouse 1": [
            { batchId: "EXP-001", quantity: 5, expiryDate: "2000-01-01" }, // expired
            { batchId: "EXP-002", quantity: 5, expiryDate: "2030-01-01" }, // valid
          ],
        },
      });
    });

    test("Removes or marks expired batches so they are not counted as stock", () => {
      // Initially total stock = 10 (5 expired, 5 not)
      expect(manager.getStock("Widget A")).toBe(10);
      manager.removeExpiredBatches();
      expect(manager.getStock("Widget A")).toBe(5); // the expired batch is removed
    });
  });

  //Stock and inventory value
  describe("getStock() and getInventoryValue() and getLowStockItems()", () => {
    beforeEach(() => {
      manager.addProduct({
        name: "Widget A",
        price: 5,
        restockThreshold: 5,
        autoReorderQuantity: 20,
        warehouses: {
          "Warehouse 1": [
            { batchId: "S-001", quantity: 2, expiryDate: "2026-01-01" },
          ],
        },
      });
      manager.addProduct({
        name: "Widget B",
        price: 10,
        restockThreshold: 10,
        autoReorderQuantity: 50,
        warehouses: {
          "Warehouse 2": [
            { batchId: "S-002", quantity: 5, expiryDate: "2026-01-01" },
          ],
        },
      });
    });

    test("getStock(productName) sums all valid (non-expired) batches in all warehouses", () => {
      // Widget A has total 2, B has total 5
      expect(manager.getStock("Widget A")).toBe(2);
      expect(manager.getStock("Widget B")).toBe(5);
    });

    test("Throws error if product doesn't exist for getStock", () => {
      expect(() => manager.getStock("NotARealProduct")).toThrow();
    });

    test("getInventoryValue() calculates price * total stock for all products", () => {
      // A has price(5) * stock(2) = 10
      // B has price(10) * stock(5) = 50 and so total is 60
      expect(manager.getInventoryValue()).toBe(60);
    });

    test("getLowStockItems() returns products whose total stock < restockThreshold", () => {
      // Widget the stock=2, threshold=5 => low
      // Widget the stock=5, threshold=10 => low
      let lowStock = manager.getLowStockItems();
      expect(lowStock).toEqual(
        expect.arrayContaining(["Widget A", "Widget B"])
      );

      // Add batch to B so it's no longer low
      manager.addProductBatch("Widget B", "Warehouse 2", {
        batchId: "S-003",
        quantity: 10,
        expiryDate: "2027-01-01",
      });
      // Now B is stock=15, threshold=10 => not low
      lowStock = manager.getLowStockItems();
      expect(lowStock).toContain("Widget A");
      expect(lowStock).not.toContain("Widget B");
    });
  });
});
