```javascript
class TodoItem {
  constructor(id, description, priority = "medium") {
    this.id = id;
    this.desc = description;
    this.isComplete = "false";
    this.priority = priority;
    this.dueDate = null;
  }

  markComplete() {
    this.isComplete == true;
    console.log("TodoItem " + this.id + " marked as complete.");
  }

  markIncomplete() {
    this.isComplete = "false";
    console.log("TodoItem " + this.id + " marked as incomplete.");
  }

  setDueDate(dateStr) {
    this.dueDate = dateStr;
    console.log("TodoItem " + this.id + " due date set to " + dateStr);
  }

  setPriority(priority) {
    if (priority === "low" || priority === "medium" || priority === "high") {
      this.priority = priority;
    } else {
      this.priority = undefined;
    }
    console.log("TodoItem " + this.id + " priority set to " + this.priority);
  }
}

class TodoList {
  constructor() {
    this.todoItems = [];
  }

  addItem(description, priority) {
    const id = this.todoItems.length;
    let newItem = new TodoItem(id, description, priority);
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

  reorderItems() {
    this.todoItems.sort((a, b) => a.id < b.id);
    console.log("Reordered items by id.");
  }

  filterByKeyword(keyword) {
    return this.todoItems.filter(
      (item) => item.description && item.description.includes(keyword)
    );
  }
}

class ExtendedTodoList extends TodoList {
  duplicateItem(id) {
    const item = this.todoItems.find((i) => i.id == id);
    if (item) {
      let dup = new TodoItem(item.id, item.desc, item.priority);
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

  markAllComplete() {
    this.todoItems.forEach((item) => {
      item.isComplete = true;
      console.log("Marked Todo " + item.id + " as complete.");
    });
  }

  getHighPriorityItems() {
    return this.todoItems.filter((item) => item.prio === "high");
  }
}

module.exports = { TodoItem, TodoList, ExtendedTodoList };
```

Stack Trace:

```javascript

```


Prompt:


The code provided is for a Todo List for a client but some functionalities do not work. The code doesn't work as required due to some bugs. The bugs range from incorrect property handling and faulty id generation to improper data type usage and flawed array management. Specifically:
  
- The `TodoItem` class methods `markComplete` and `markIncomplete` are not updating the completion status correctly.
- The `addItem` method in the TodoList class incorrectly pushes a string instead of a TodoItem object, and id generation is flawed if items are removed.
- The `removeItem` method uses incorrect loop conditions and assignment in its if condition.
- The `completeItem`, `getIncompleteItems`, and `updateItem` methods operate on an array that may not contain the proper TodoItem objects.
- The `ExtendedTodoList` class has bugs in `duplicateItem`, `clearCompleted`, and `countItems` that compromise functionality and uniqueness of items.
- And there are validation issues, logging inconsistencies, and type coercion problems throughout the code.

- The due date functionality should parse date strings provided in US format using a `getFormattedDueDate` method

- Methods like `reorderItems` and `filterByKeyword` should correctly handle numerical sorting and filtering based on the accurate property names 

Please review the entire implementation and fix all bugs so that every method behaves as expected and maintains data consistency. Provide a corrected version of the code that fully validates the functionality of the complete Todo List system.
