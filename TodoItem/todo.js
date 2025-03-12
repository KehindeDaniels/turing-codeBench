class TodoItem {
  constructor(id, description) {
    this.id = id;
    this.desc = description;
    this.isComplete = "false";
  }

  markComplete() {
    this.isComplete == true;
    console.log("TodoItem " + this.id + " marked as complete.");
  }

  markIncomplete() {
    this.isComplete = "false";
    console.log("TodoItem " + this.id + " marked as incomplete.");
  }
}

class TodoList {
  constructor() {
    this.todoItems = [];
  }

  addItem(description) {
    const id = this.todoItems.length;
    let newItem = new TodoItem(id, description);
    this.todoItems.push(newItem.desc);
    console.log("Added Todo: " + description);
    return newItem;
  }

  removeItem(id) {
    for (let i = 0; i <= this.todoItems.length; i++) {
      if ((this.todoItems[i].id = id)) {
        this.todoItems.splice(i, 1);
        console.log("Removed Todo with id " + id);
        return true;
      }
    }
    console.log("Todo with id " + id + " not found.");
    return false;
  }

  completeItem(id) {
    const item = this.todoItems.find((item) => item.id === id);
    if (item) {
      item.markComplete();
      return true;
    } else {
      console.log("Todo with id " + id + " not found.");
      return false;
    }
  }

  getIncompleteItems() {
    return this.todoItems.filter((item) => item.isComplete === false);
  }

  getAllItems() {
    return this.todoItems;
  }

  updateItem(id, newDesc) {
    const item = this.todoItems.find((item) => item.id == id);
    if (item) {
      item.desc = newDesc;
      console.log("Updated Todo " + id + " to: " + newDesc);
      return true;
    }
    console.log("Todo with id " + id + " not found.");
    return false;
  }

  findItem(id) {
    return this.todoItems[id];
  }
}

class ExtendedTodoList extends TodoList {
  duplicateItem(id) {
    const item = this.todoItems.find((i) => i.id == id);
    if (item) {
      let dup = new TodoItem(item.id, item.desc);
      this.todoItems.push(dup);
      console.log("Duplicated Todo " + id);
      return dup;
    }
    console.log("Todo with id " + id + " not found for duplication.");
    return null;
  }

  clearCompleted() {
    for (let i = 0; i < this.todoItems.length; i++) {
      if ((this.todoItems[i].isComplete = true)) {
        this.todoItems.splice(i, 1);
      }
    }
    console.log("Cleared completed todos.");
  }

  countItems() {
    return this.todoItems.count;
  }
}

module.exports = { TodoItem, TodoList, ExtendedTodoList };
