class TodoItem {
  constructor(id, description, dueDate = null, priority = "normal") {
    this.id = id;
    this.description = description;
    this.isComplete = false;
    this.dueDate = dueDate ? new Date(dueDate) : null;
    this.priority = priority;
  }

  markComplete() {
    this.isComplete = true;
    console.log(`TodoItem ${this.id} marked as complete.`);
  }

  markIncomplete() {
    this.isComplete = false;
    console.log(`TodoItem ${this.id} marked as incomplete.`);
  }

  updateDueDate(newDate) {
    const date = new Date(newDate);
    if (isNaN(date)) throw new Error("Invalid date format.");
    this.dueDate = date;
    console.log(`TodoItem ${this.id} due date updated.`);
  }

  updatePriority(newPriority) {
    const validPriorities = ["high", "normal", "low"];
    if (!validPriorities.includes(newPriority))
      throw new Error("Invalid priority.");
    this.priority = newPriority;
    console.log(`TodoItem ${this.id} priority updated.`);
  }
}

class TodoList {
  constructor() {
    this.todoItems = [];
    this.nextId = 0;
  }

  addItem(description, dueDate, priority) {
    const newItem = new TodoItem(this.nextId++, description, dueDate, priority);
    this.todoItems.push(newItem);
    console.log(`Added Todo: ${description}`);
    return newItem;
  }

  removeItem(id) {
    const index = this.todoItems.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.todoItems.splice(index, 1);
      console.log(`Removed Todo with id ${id}`);
      return true;
    }
    console.log(`Todo with id ${id} not found.`);
    return false;
  }

  completeItem(id) {
    const item = this.todoItems.find((item) => item.id === id);
    if (item) {
      item.markComplete();
      return true;
    }
    console.log(`Todo with id ${id} not found.`);
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
      console.log(`Updated Todo ${id} to: ${newDesc}`);
      return true;
    }
    console.log(`Todo with id ${id} not found.`);
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
    const item = this.findItem(id);
    if (item) {
      const dup = new TodoItem(
        this.nextId++,
        item.description,
        item.dueDate,
        item.priority
      );
      this.todoItems.push(dup);
      console.log(`Duplicated Todo ${id}`);
      return dup;
    }
    console.log(`Todo with id ${id} not found for duplication.`);
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
