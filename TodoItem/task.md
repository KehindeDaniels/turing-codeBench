Base Code:

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
 FAIL  ./index.test.js
  TodoItem Class
    × should create a todo item with correct id and description (8 ms)
    × should mark item as complete and update status correctly (1 ms)
    × should mark item as incomplete and update status correctly (1 ms)
    × should set due date correctly and format it in US format (MM/DD/YYYY) (1 ms)
    √ should set valid priority
    √ should set undefined for invalid priority
  TodoList Class
    × should add a new todo item and store it correctly (2 ms)
    × should remove an existing todo item correctly
    × should not remove a non-existent todo item
    × should complete a todo item and update its status (1 ms)
    × should return only incomplete todo items (1 ms)
    √ should return all todo items (1 ms)
    × should update the description of an existing todo item (1 ms)
    × should find a todo item correctly by id (1 ms)
    × should reorder items by id (1 ms)
    × should filter items by keyword in description (1 ms)
  ExtendedTodoList Class
    × should duplicate a todo item with a new unique id (1 ms)
    × should clear all completed todo items (1 ms)
    × should return the correct count of todo items (1 ms)
    × should mark all items as complete (1 ms)
    × should return only high priority items (1 ms)

  ● TodoItem Class › should create a todo item with correct id and description

    expect(received).toBe(expected) // Object.is equality

    Expected: "Test todo"
    Received: undefined

      14 |     expect(item.id).toBe(1);
      15 |     // (Assuming the fixed version exposes "description" (not "desc")
    > 16 |     expect(item.description).toBe("Test todo");
         |                              ^
      17 |     expect(item.isComplete).toBe(false);
      18 |   });
      19 |

      at Object.toBe (index.test.js:16:30)

  ● TodoItem Class › should mark item as complete and update status correctly

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: "false"

      20 |   test("should mark item as complete and update status correctly", () => {
      21 |     item.markComplete();
    > 22 |     expect(item.isComplete).toBe(true); // This will fail due to bug in markComplete
         |                             ^
      23 |   });
      24 |
      25 |   test("should mark item as incomplete and update status correctly", () => {

      at Object.toBe (index.test.js:22:29)

  ● TodoItem Class › should mark item as incomplete and update status correctly

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: "false"

      26 |     item.markComplete(); // mark complete first
      27 |     item.markIncomplete();
    > 28 |     expect(item.isComplete).toBe(false); // Fails because markIncomplete sets string "false"
         |                             ^
      29 |   });
      30 |
      31 |   test("should set due date correctly and format it in US format (MM/DD/YYYY)", () => {

      at Object.toBe (index.test.js:28:29)

  ● TodoItem Class › should set due date correctly and format it in US format (MM/DD/YYYY)

    TypeError: item.getFormattedDueDate is not a function

      32 |     const dateStr = "12/31/2025";
      33 |     item.setDueDate(dateStr);
    > 34 |     expect(item.getFormattedDueDate()).toBe("12/31/2025");
         |                 ^
      35 |   });
      36 |
      37 |   test("should set valid priority", () => {

      at Object.getFormattedDueDate (index.test.js:34:17)

  ● TodoList Class › should add a new todo item and store it correctly

    expect(received).toEqual(expected) // deep equality

    Expected: {"desc": "Buy milk", "dueDate": null, "id": 0, "isComplete": "false", "priority": "low"}
    Received: "Buy milk"

      55 |     const newItem = list.addItem("Buy milk", "low");
      56 |     const items = list.getAllItems();
    > 57 |     expect(items[0]).toEqual(newItem);
         |                      ^
      58 |     expect(newItem.description).toBe("Buy milk");
      59 |   });
      60 |

      at Object.toEqual (index.test.js:57:22)

  ● TodoList Class › should remove an existing todo item correctly

    TypeError: Cannot create property 'id' on string 'Buy eggs'

      48 |   removeItem(id) {
      49 |     for (let i = 0; i <= this.todoItems.length; i++) {
    > 50 |       if ((this.todoItems[i].id = id)) {
         |                                ^
      51 |         this.todoItems.splice(i, 1);
      52 |         console.log("Removed Todo with id " + id);
      53 |         return true;

      at TodoList.removeItem (solution.js:50:32)
      at Object.removeItem (index.test.js:63:26)

  ● TodoList Class › should not remove a non-existent todo item

    TypeError: Cannot set properties of undefined (setting 'id')

      48 |   removeItem(id) {
      49 |     for (let i = 0; i <= this.todoItems.length; i++) {
    > 50 |       if ((this.todoItems[i].id = id)) {
         |                                ^
      51 |         this.todoItems.splice(i, 1);
      52 |         console.log("Removed Todo with id " + id);
      53 |         return true;

      at TodoList.removeItem (solution.js:50:32)
      at Object.removeItem (index.test.js:70:26)

  ● TodoList Class › should complete a todo item and update its status

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

      75 |     const newItem = list.addItem("Walk the dog", "medium");
      76 |     const completed = list.completeItem(newItem.id);
    > 77 |     expect(completed).toBe(true);
         |                       ^
      78 |     expect(newItem.isComplete).toBe(true);
      79 |   });
      80 |

      at Object.toBe (index.test.js:77:23)

  ● TodoList Class › should return only incomplete todo items

    expect(received).toBe(expected) // Object.is equality

    Expected: 1
    Received: 0

      84 |     list.completeItem(item1.id);
      85 |     const incompleteItems = list.getIncompleteItems();
    > 86 |     expect(incompleteItems.length).toBe(1);
         |                                    ^
      87 |     expect(incompleteItems[0].id).toBe(item2.id);
      88 |   });
      89 |

      at Object.toBe (index.test.js:86:36)

  ● TodoList Class › should update the description of an existing todo item

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

       98 |     const newItem = list.addItem("Old Description", "medium");
       99 |     const updated = list.updateItem(newItem.id, "New Description");
    > 100 |     expect(updated).toBe(true);
          |                     ^
      101 |     expect(newItem.description).toBe("New Description");
      102 |   });
      103 |

      at Object.toBe (index.test.js:100:21)

  ● TodoList Class › should find a todo item correctly by id

    expect(received).toEqual(expected) // deep equality

    Expected: {"desc": "Find me", "dueDate": null, "id": 0, "isComplete": "false", "priority": "medium"}
    Received: "Find me"

      105 |     const newItem = list.addItem("Find me", "medium");
      106 |     const found = list.findItem(newItem.id);
    > 107 |     expect(found).toEqual(newItem);
          |                   ^
      108 |   });
      109 |
      110 |   test("should reorder items by id", () => {

      at Object.toEqual (index.test.js:107:19)

  ● TodoList Class › should reorder items by id

    expect(received).toBe(expected) // Object.is equality

    Expected: 1
    Received: 3

      117 |     list.reorderItems();
      118 |     // Expecting the first item to have the smallest id
    > 119 |     expect(list.todoItems[0].id).toBe(1);
          |                                  ^
      120 |   });
      121 |
      122 |   test("should filter items by keyword in description", () => {

      at Object.toBe (index.test.js:119:34)

  ● TodoList Class › should filter items by keyword in description

    expect(received).toBe(expected) // Object.is equality

    Expected: 2
    Received: 0

      127 |     ];
      128 |     const filtered = list.filterByKeyword("Buy");
    > 129 |     expect(filtered.length).toBe(2);
          |                             ^
      130 |   });
      131 | });
      132 |

      at Object.toBe (index.test.js:129:29)

  ● ExtendedTodoList Class › should duplicate a todo item with a new unique id

    expect(received).not.toBeNull()

    Received: null

      140 |     const original = extList.addItem("Original Task", "medium");
      141 |     const duplicate = extList.duplicateItem(original.id);
    > 142 |     expect(duplicate).not.toBeNull();
          |                           ^
      143 |     expect(duplicate.id).not.toBe(original.id); // Will fail due to bug duplicating same id
      144 |     expect(duplicate.description).toBe(original.description);
      145 |   });

      at Object.toBeNull (index.test.js:142:27)

  ● ExtendedTodoList Class › should clear all completed todo items

    TypeError: Cannot create property 'isComplete' on string 'Task 1'

      119 |   clearCompleted() {
      120 |     for (let i = 0; i < this.todoItems.length; i++) {
    > 121 |       if ((this.todoItems[i].isComplete = true)) {
          |                                        ^
      122 |         this.todoItems.splice(i, 1);
      123 |       }
      124 |     }

      at ExtendedTodoList.clearCompleted (solution.js:121:40)
      at Object.clearCompleted (index.test.js:152:13)

  ● ExtendedTodoList Class › should return the correct count of todo items

    expect(received).toBe(expected) // Object.is equality

    Expected: 3
    Received: undefined

      162 |     extList.addItem("Task 2", "medium");
      163 |     extList.addItem("Task 3", "high");
    > 164 |     expect(extList.countItems()).toBe(3);
          |                                  ^
      165 |   });
      166 |
      167 |   test("should mark all items as complete", () => {

      at Object.toBe (index.test.js:164:34)

  ● ExtendedTodoList Class › should mark all items as complete

    TypeError: Cannot create property 'isComplete' on string 'Task A'

      132 |   markAllComplete() {
      133 |     this.todoItems.forEach((item) => {
    > 134 |       item.isComplete = true;
          |                      ^
      135 |       console.log("Marked Todo " + item.id + " as complete.");
      136 |     });
      137 |   }

      at solution.js:134:22
          at Array.forEach (<anonymous>)
      at ExtendedTodoList.forEach [as markAllComplete] (solution.js:133:20)
      at Object.markAllComplete (index.test.js:170:13)

  ● ExtendedTodoList Class › should return only high priority items

    expect(received).toBe(expected) // Object.is equality

    Expected: 1
    Received: 0

      181 |     ];
      182 |     const highPriority = extList.getHighPriorityItems();
    > 183 |     expect(highPriority.length).toBe(1);
          |                                 ^
      184 |     expect(highPriority[0].description).toBe("High Priority");
      185 |   });
      186 | });

      at Object.toBe (index.test.js:183:33)

Test Suites: 1 failed, 1 total
Tests:       18 failed, 3 passed, 21 total
Snapshots:   0 total
Time:        1.013 s
Ran all test suites.
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

Please review the entire implementation and fix all bugs so that every method behaves as expected and maintains data consistency. Provide a corrected version of the code that fully validates the functionality of the complete Todo List

```javascript
const shazam = ./slack = let user === usManager.getUsers(usman)
usman.send(email)
```

``
