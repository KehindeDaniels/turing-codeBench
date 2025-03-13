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
    // Assuming the fixed version exposes "description" (not "desc")
    expect(item.description).toBe("Test todo");
    // And the default complete status should be false (boolean)
    expect(item.isComplete).toBe(false);
  });

  test("should mark item as complete and update status correctly", () => {
    item.markComplete();
    expect(item.isComplete).toBe(true);
  });

  test("should mark item as incomplete and update status correctly", () => {
    item.markComplete(); // mark complete first
    item.markIncomplete();
    expect(item.isComplete).toBe(false);
  });

  test("should update due date correctly", () => {
    item.updateDueDate("2026-01-01");
    expect(item.dueDate).toEqual(new Date("2026-01-01"));
  });

  test("should update priority correctly", () => {
    item.updatePriority("high");
    expect(item.priority).toBe("high");
  });

  test("should throw error when updating due date with an invalid value", () => {
    expect(() => {
      item.updateDueDate("not-a-date");
    }).toThrow(Error);
  });

  test("should throw error when updating priority with an invalid value", () => {
    expect(() => {
      item.updatePriority("urgent");
    }).toThrow(Error);
  });
});

describe("TodoList Basic Operations", () => {
  let list;
  beforeEach(() => {
    list = new TodoList();
  });

  test("should add a new todo item and store it correctly", () => {
    const newItem = list.addItem("Buy milk", "2025-12-31", "normal");
    const items = list.getAllItems();
    expect(items[0]).toEqual(newItem);
    expect(newItem.description).toBe("Buy milk");
  });

  test("should remove an existing todo item correctly", () => {
    const newItem = list.addItem("Buy eggs", "2025-12-31", "normal");
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
    const newItem = list.addItem("Walk the dog", "2025-12-31", "normal");
    const completed = list.completeItem(newItem.id);
    expect(completed).toBe(true);
    expect(newItem.isComplete).toBe(true);
  });

  test("should return only incomplete todo items", () => {
    const item1 = list.addItem("Task 1", null, "normal");
    const item2 = list.addItem("Task 2", null, "normal");
    list.completeItem(item1.id);
    const incompleteItems = list.getIncompleteItems();
    expect(incompleteItems.length).toBe(1);
    expect(incompleteItems[0].id).toBe(item2.id);
  });

  test("should return all todo items", () => {
    list.addItem("Task 1", null, "normal");
    list.addItem("Task 2", null, "normal");
    const allItems = list.getAllItems();
    expect(allItems.length).toBe(2);
  });

  test("should update the description of an existing todo item", () => {
    const newItem = list.addItem("Old Description", null, "normal");
    const updated = list.updateItem(newItem.id, "New Description");
    expect(updated).toBe(true);
    expect(newItem.description).toBe("New Description");
  });

  test("should find a todo item correctly by id", () => {
    const newItem = list.addItem("Find me", null, "normal");
    const found = list.findItem(newItem.id);
    expect(found).toEqual(newItem);
  });

  test("should sort items by priority", () => {
    const item1 = list.addItem("Task 1", null, "low");
    const item2 = list.addItem("Task 2", null, "high");
    const item3 = list.addItem("Task 3", null, "normal");
    list.sortByPriority();
    const sorted = list.getAllItems();
    expect(sorted[0].priority).toBe("high");
    expect(sorted[1].priority).toBe("normal");
    expect(sorted[2].priority).toBe("low");
  });
});

describe("ExtendedTodoList Advanced Features", () => {
  let extList;
  beforeEach(() => {
    extList = new ExtendedTodoList();
  });

  test("should duplicate a todo item with a new unique id", () => {
    const original = extList.addItem("Original Task", "2025-12-31", "normal");
    const duplicate = extList.duplicateItem(original.id);
    expect(duplicate).not.toBeNull();
    // The test expects a new unique id but the bug copies the same id.
    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.desc).toBe(original.desc);
  });

  test("should clear all completed todo items", () => {
    const item1 = extList.addItem("Task 1", null, "normal");
    const item2 = extList.addItem("Task 2", null, "normal");
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
    extList.addItem("Task 1", null, "normal");
    extList.addItem("Task 2", null, "normal");
    extList.addItem("Task 3", null, "normal");
    expect(extList.countItems()).toBe(3);
  });
});
