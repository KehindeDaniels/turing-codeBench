class TodoItem {
  // Changed this.desc to this.description to match expected property name
  constructor(id, description, priority = "medium") {
    this.id = id;
    this.description = description;
    this.isComplete = false;
    this.priority = priority;
    this.dueDate = null;
  }

  markComplete() {
    this.isComplete = true;
    console.log(`TodoItem ${this.id} marked as complete.`);
  }

  markIncomplete() {
    this.isComplete = false;
    console.log(`TodoItem ${this.id} marked as incomplete.`);
  }

  setDueDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format. Use MM/DD/YYYY");
    }
    this.dueDate = date;
    console.log(`TodoItem ${this.id} due date set to ${dateStr}`);
  }

  getFormattedDueDate() {
    if (!this.dueDate) return null;
    return this.dueDate.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }

  // Set priority to undefined for invalid values instead of defaulting to "medium"
  setPriority(priority) {
    const validPriorities = ["low", "medium", "high"];
    if (validPriorities.includes(priority)) {
      this.priority = priority;
    } else {
      this.priority = undefined;
    }
    console.log(`TodoItem ${this.id} priority set to ${this.priority}`);
  }
}

class TodoList {
  constructor() {
    this.todoItems = [];
    this.nextId = 0;
  }

  addItem(description, priority) {
    const newItem = new TodoItem(this.nextId++, description, priority);
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

  // Using description property instead of desc
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
    return this.todoItems.find((item) => item.id === id) || null;
  }

  reorderItems() {
    this.todoItems.sort((a, b) => a.id - b.id);
    console.log("Reordered items by id.");
  }

  filterByKeyword(keyword) {
    return this.todoItems.filter(
      (item) =>
        item.description &&
        item.description.toLowerCase().includes(keyword.toLowerCase())
    );
  }
}

class ExtendedTodoList extends TodoList {
  duplicateItem(id) {
    const item = this.todoItems.find((i) => i.id === id);
    if (item) {
      const dup = new TodoItem(this.nextId++, item.description, item.priority);
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

  markAllComplete() {
    this.todoItems.forEach((item) => item.markComplete());
  }

  getHighPriorityItems() {
    return this.todoItems.filter((item) => item.priority === "high");
  }
}

module.exports = { TodoItem, TodoList, ExtendedTodoList };
