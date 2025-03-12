const { TodoItem, TodoList, ExtendedTodoList } = require("./solution"); // Adjust the path if needed

// I want to remove all console. logs from the terminal
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
});

describe("TodoList Class", () => {
  let list;
  beforeEach(() => {
    list = new TodoList();
  });

  test("should add a new todo item and store it correctly", () => {
    const newItem = list.addItem("Buy milk");
    const items = list.getAllItems();
    expect(items[0]).toEqual(newItem);
    expect(newItem.description).toBe("Buy milk");
  });

  test("should remove an existing todo item correctly", () => {
    const newItem = list.addItem("Buy eggs");
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
    const newItem = list.addItem("Walk the dog");
    const completed = list.completeItem(newItem.id);
    expect(completed).toBe(true);
    expect(newItem.isComplete).toBe(true);
  });

  test("should return only incomplete todo items", () => {
    const item1 = list.addItem("Task 1");
    const item2 = list.addItem("Task 2");
    list.completeItem(item1.id);
    const incompleteItems = list.getIncompleteItems();
    expect(incompleteItems.length).toBe(1);
    expect(incompleteItems[0].id).toBe(item2.id);
  });

  test("should return all todo items", () => {
    list.addItem("Task 1");
    list.addItem("Task 2");
    const allItems = list.getAllItems();
    expect(allItems.length).toBe(2);
  });

  test("should update the description of an existing todo item", () => {
    const newItem = list.addItem("Old Description");
    const updated = list.updateItem(newItem.id, "New Description");
    expect(updated).toBe(true);
    expect(newItem.description).toBe("New Description");
  });

  test("should find a todo item correctly by id", () => {
    const newItem = list.addItem("Find me");
    const found = list.findItem(newItem.id);
    expect(found).toEqual(newItem);
  });
});

describe("ExtendedTodoList Class", () => {
  let extList;
  beforeEach(() => {
    extList = new ExtendedTodoList();
  });

  test("should duplicate a todo item with a new unique id", () => {
    const original = extList.addItem("Original Task");
    const duplicate = extList.duplicateItem(original.id);
    expect(duplicate).not.toBeNull();
    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.description).toBe(original.description);
  });

  test("should clear all completed todo items", () => {
    const item1 = extList.addItem("Task 1");
    const item2 = extList.addItem("Task 2");
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
    extList.addItem("Task 1");
    extList.addItem("Task 2");
    extList.addItem("Task 3");
    expect(extList.countItems()).toBe(3);
  });
});
