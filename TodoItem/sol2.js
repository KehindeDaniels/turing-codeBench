class TodoItem {
  constructor(id, description, dueDate = null, priority = "normal") {
    this.id = id;
    this.description = description;
    this.isComplete = false;
    this.dueDate = dueDate;
    this.priority = priority;
  }

  markComplete() {
    this.isComplete = true;
    console.log("TodoItem " + this.id + " marked as complete.");
  }

  markIncomplete() {
    this.isComplete = false;
    console.log("TodoItem " + this.id + " marked as incomplete.");
  }

  updateDueDate(newDate) {
    const parsedDate = new Date(newDate);
    if (isNaN(parsedDate)) {
      throw new Error("Invalid date format.");
    }
    this.dueDate = parsedDate;
    console.log("TodoItem " + this.id + " due date updated.");
  }

  updatePriority(newPriority) {
    const validPriorities = ["high", "normal", "low"];
    if (!validPriorities.includes(newPriority)) {
      throw new Error("Invalid priority value.");
    }
    this.priority = newPriority;
    console.log("TodoItem " + this.id + " priority updated.");
  }
}

class TodoList {
  constructor() {
    this.todoItems = [];
  }

  addItem(description, dueDate, priority) {
    const id =
      this.todoItems.length > 0
        ? Math.max(...this.todoItems.map((item) => item.id)) + 1
        : 0;
    const newItem = new TodoItem(id, description, dueDate, priority);
    this.todoItems.push(newItem);
    console.log("Added Todo: " + description);
    return newItem;
  }

  removeItem(id) {
    const index = this.todoItems.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.todoItems.splice(index, 1);
      console.log("Removed Todo with id " + id);
      return true;
    }
    console.log("Todo with id " + id + " not found.");
    return false;
  }

  completeItem(id) {
    const item = this.todoItems.find((item) => item.id === id);
    if (item) {
      item.markComplete();
      return true;
    }
    console.log("Todo with id " + id + " not found.");
    return false;
  }

  getIncompleteItems() {
    return this.todoItems.filter((item) => !item.isComplete);
  }

  getAllItems() {
    return this.todoItems;
  }

  updateItem(id, newDesc) {
    const item = this.todoItems.find((item) => item.id === id);
    if (item) {
      item.description = newDesc;
      console.log("Updated Todo " + id + " to: " + newDesc);
      return true;
    }
    console.log("Todo with id " + id + " not found.");
    return false;
  }

  findItem(id) {
    return this.todoItems.find((item) => item.id === id);
  }

  sortByPriority() {
    const priorityOrder = { high: 1, normal: 2, low: 3 };
    this.todoItems.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
    console.log("Sorted items by priority.");
  }
}

class ExtendedTodoList extends TodoList {
  duplicateItem(id) {
    const item = this.todoItems.find((i) => i.id === id);
    if (item) {
      const newId =
        this.todoItems.length > 0
          ? Math.max(...this.todoItems.map((item) => item.id)) + 1
          : 0;
      const dup = new TodoItem(
        newId,
        item.description,
        item.dueDate,
        item.priority
      );
      this.todoItems.push(dup);
      console.log("Duplicated Todo " + id);
      return dup;
    }
    console.log("Todo with id " + id + " not found for duplication.");
    return null;
  }

  clearCompleted() {
    this.todoItems = this.todoItems.filter((item) => !item.isComplete);
    console.log("Cleared completed todos.");
  }

  countItems() {
    return this.todoItems.length;
  }
}

module.exports = { TodoItem, TodoList, ExtendedTodoList };
