const { TodoItem, TodoList, ExtendedTodoList } = require("./solution");

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

describe("TodoItem Class", () => {
  let item;
  beforeEach(() => {
    item = new TodoItem(1, "Test todo");
  });

  test("should create a todo item with correct id and description", () => {
    expect(item.id).toBe(1);
    // (Assuming the fixed version exposes "description" (not "desc")
    expect(item.description).toBe("Test todo");
    expect(item.isComplete).toBe(false);
  });

  test("should mark item as complete and update status correctly", () => {
    item.markComplete();
    expect(item.isComplete).toBe(true); // This will fail due to bug in markComplete
  });

  test("should mark item as incomplete and update status correctly", () => {
    item.markComplete(); // mark complete first
    item.markIncomplete();
    expect(item.isComplete).toBe(false); // Fails because markIncomplete sets string "false"
  });

  test("should set due date correctly and format it in US format (MM/DD/YYYY)", () => {
    const dateStr = "12/31/2025";
    item.setDueDate(dateStr);
    expect(item.getFormattedDueDate()).toBe("12/31/2025");
  });

  test("should set valid priority", () => {
    item.setPriority("high");
    expect(item.priority).toBe("high");
  });

  test("should set undefined for invalid priority", () => {
    item.setPriority("urgent");
    expect(item.priority).toBeUndefined();
  });
});

describe("TodoList Class", () => {
  let list;
  beforeEach(() => {
    list = new TodoList();
  });

  test("should add a new todo item and store it correctly", () => {
    const newItem = list.addItem("Buy milk", "low");
    const items = list.getAllItems();
    expect(items[0]).toEqual(newItem);
    expect(newItem.description).toBe("Buy milk");
  });

  test("should remove an existing todo item correctly", () => {
    const newItem = list.addItem("Buy eggs", "medium");
    const removed = list.removeItem(newItem.id);
    expect(removed).toBe(true);
    const items = list.getAllItems();
    expect(items.find((item) => item.id === newItem.id)).toBeUndefined();
  });

  test("should not remove a non-existent todo item", () => {
    const removed = list.removeItem(999);
    expect(removed).toBe(false);
  });

  test("should complete a todo item and update its status", () => {
    const newItem = list.addItem("Walk the dog", "medium");
    const completed = list.completeItem(newItem.id);
    expect(completed).toBe(true);
    expect(newItem.isComplete).toBe(true);
  });

  test("should return only incomplete todo items", () => {
    const item1 = list.addItem("Task 1", "low");
    const item2 = list.addItem("Task 2", "high");
    list.completeItem(item1.id);
    const incompleteItems = list.getIncompleteItems();
    expect(incompleteItems.length).toBe(1);
    expect(incompleteItems[0].id).toBe(item2.id);
  });

  test("should return all todo items", () => {
    list.addItem("Task 1", "low");
    list.addItem("Task 2", "high");
    const allItems = list.getAllItems();
    expect(allItems.length).toBe(2);
  });

  test("should update the description of an existing todo item", () => {
    const newItem = list.addItem("Old Description", "medium");
    const updated = list.updateItem(newItem.id, "New Description");
    expect(updated).toBe(true);
    expect(newItem.description).toBe("New Description");
  });

  test("should find a todo item correctly by id", () => {
    const newItem = list.addItem("Find me", "medium");
    const found = list.findItem(newItem.id);
    expect(found).toEqual(newItem);
  });

  test("should reorder items by id", () => {
    // Create items with out-of-order ids manually
    list.todoItems = [
      new TodoItem(3, "Task 3"),
      new TodoItem(1, "Task 1"),
      new TodoItem(2, "Task 2"),
    ];
    list.reorderItems();
    // Expecting the first item to have the smallest id
    expect(list.todoItems[0].id).toBe(1);
  });

  test("should filter items by keyword in description", () => {
    list.todoItems = [
      new TodoItem(0, "Buy milk"),
      new TodoItem(1, "Call John"),
      new TodoItem(2, "Buy eggs"),
    ];
    const filtered = list.filterByKeyword("Buy");
    expect(filtered.length).toBe(2);
  });
});

describe("ExtendedTodoList Class", () => {
  let extList;
  beforeEach(() => {
    extList = new ExtendedTodoList();
  });

  test("should duplicate a todo item with a new unique id", () => {
    const original = extList.addItem("Original Task", "medium");
    const duplicate = extList.duplicateItem(original.id);
    expect(duplicate).not.toBeNull();
    expect(duplicate.id).not.toBe(original.id); // Will fail due to bug duplicating same id
    expect(duplicate.description).toBe(original.description);
  });

  test("should clear all completed todo items", () => {
    const item1 = extList.addItem("Task 1", "low");
    const item2 = extList.addItem("Task 2", "high");
    extList.completeItem(item1.id);
    const countBefore = extList.getAllItems().length;
    extList.clearCompleted();
    const countAfter = extList.getAllItems().length;
    expect(countAfter).toBeLessThan(countBefore);
    expect(
      extList.getAllItems().find((item) => item.id === item1.id)
    ).toBeUndefined();
  });

  test("should return the correct count of todo items", () => {
    extList.addItem("Task 1", "low");
    extList.addItem("Task 2", "medium");
    extList.addItem("Task 3", "high");
    expect(extList.countItems()).toBe(3);
  });

  test("should mark all items as complete", () => {
    const item1 = extList.addItem("Task A", "low");
    const item2 = extList.addItem("Task B", "high");
    extList.markAllComplete();
    expect(item1.isComplete).toBe(true);
    expect(item2.isComplete).toBe(true);
  });

  test("should return only high priority items", () => {
    // Manually set up items with a mix of priorities
    extList.todoItems = [
      new TodoItem(0, "Low Priority", "low"),
      new TodoItem(1, "High Priority", "high"),
      new TodoItem(2, "Medium Priority", "medium"),
    ];
    const highPriority = extList.getHighPriorityItems();
    expect(highPriority.length).toBe(1);
    expect(highPriority[0].description).toBe("High Priority");
  });
});
