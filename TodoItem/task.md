Base Code:
``` javascript

class TodoItem {
  constructor(id, description, dueDate = null, priority = "normal") {
    this.id = id;
    this.desc = description;
    this.isComplete = "false";
    this.dueDate = dueDate;
    this.priority = priority;
  }

  markComplete() {
    this.isComplete == true;
    console.log("TodoItem " + this.id + " marked as complete.");
  }

  markIncomplete() {
    this.isComplete = "false";
    console.log("TodoItem " + this.id + " marked as incomplete.");
  }

  updateDueDate(newDate) {
    this.dueDate = new Date(newDate);
    console.log("TodoItem " + this.id + " due date updated.");
  }

  updatePriority(newPriority) {
    this.priority = newPriority;
    console.log("TodoItem " + this.id + " priority updated.");
  }
}

class TodoList {
  constructor() {
    this.todoItems = [];
  }

  addItem(description, dueDate, priority) {
    const id = this.todoItems.length;
    let newItem = new TodoItem(id, description, dueDate, priority);
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

  sortByPriority() {
    this.todoItems.sort((a, b) => {
      const priorityOrder = { high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    console.log("Sorted items by priority.");
  }
}

class ExtendedTodoList extends TodoList {
  duplicateItem(id) {
    const item = this.todoItems.find((i) => i.id == id);
    if (item) {
      let dup = new TodoItem(item.id, item.desc, item.dueDate, item.priority);
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
```


Stack Trace: 
```javascript
 FAIL  ./index.test.js
  TodoItem Class
    × should create a todo item with correct id and description (8 ms)                                                                
    × should mark item as complete and update status correctly (1 ms)                                                                 
    × should mark item as incomplete and update status correctly (1 ms)                                                               
    √ should update due date correctly
    √ should update priority correctly (1 ms)                      
    × should throw error when updating due date with an invalid value (1 ms)                                                          
    × should throw error when updating priority with an invalid value                                                                 
  TodoList Basic Operations
    × should add a new todo item and store it correctly (2 ms)     
    × should remove an existing todo item correctly (1 ms)
    × should not remove a non-existent todo item (1 ms)            
    × should complete a todo item and update its status (1 ms)     
    × should return only incomplete todo items (1 ms)              
    √ should return all todo items (1 ms)                          
    × should update the description of an existing todo item (1 ms)
    × should find a todo item correctly by id (1 ms)               
    × should sort items by priority (1 ms)                         
  ExtendedTodoList Advanced Features                               
    × should duplicate a todo item with a new unique id (1 ms)     
    × should clear all completed todo items (1 ms)                 
    × should return the correct count of todo items (1 ms)         
                                                                   
  ● TodoItem Class › should create a todo item with correct id and description                                                        

    expect(received).toBe(expected) // Object.is equality

    Expected: "Test todo"
    Received: undefined

      14 |     expect(item.id).toBe(1);
      15 |     // Assuming the fixed version exposes "description" (not "desc")
    > 16 |     expect(item.description).toBe("Test todo");
         |                              ^
      17 |     // And the default complete status should be false (boolean)
      18 |     expect(item.isComplete).toBe(false);
      19 |   });

      at Object.toBe (index.test.js:16:30)

  ● TodoItem Class › should mark item as complete and update status correctly

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: "false"

      21 |   test("should mark item as complete and update status correctly", () => {
      22 |     item.markComplete();
    > 23 |     expect(item.isComplete).toBe(true);
         |                             ^
      24 |   });
      25 |
      26 |   test("should mark item as incomplete and update status correctly", () => {

      at Object.toBe (index.test.js:23:29)

  ● TodoItem Class › should mark item as incomplete and update status correctly

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: "false"

      27 |     item.markComplete(); // mark complete first
      28 |     item.markIncomplete();
    > 29 |     expect(item.isComplete).toBe(false);
         |                             ^
      30 |   });
      31 |
      32 |   test("should update due date correctly", () => {      

      at Object.toBe (index.test.js:29:29)

  ● TodoItem Class › should throw error when updating due date with an invalid value

    expect(received).toThrow(expected)

    Expected constructor: Error

    Received function did not throw

      43 |     expect(() => {
      44 |       item.updateDueDate("not-a-date");
    > 45 |     }).toThrow(Error);
         |        ^
      46 |   });
      47 |
      48 |   test("should throw error when updating priority with an invalid value", () => {

      at Object.toThrow (index.test.js:45:8)

  ● TodoItem Class › should throw error when updating priority with an invalid value

    expect(received).toThrow(expected)

    Expected constructor: Error

    Received function did not throw

      49 |     expect(() => {
      50 |       item.updatePriority("urgent");
    > 51 |     }).toThrow(Error);
         |        ^
      52 |   });
      53 | });
      54 |

      at Object.toThrow (index.test.js:51:8)

  ● TodoList Basic Operations › should add a new todo item and store it correctly

    expect(received).toEqual(expected) // deep equality

    Expected: {"desc": "Buy milk", "dueDate": "2025-12-31", "id": 0, "isComplete": "false", "priority": "normal"}
    Received: "Buy milk"

      62 |     const newItem = list.addItem("Buy milk", "2025-12-31", "normal");
      63 |     const items = list.getAllItems();
    > 64 |     expect(items[0]).toEqual(newItem);
         |                      ^
      65 |     expect(newItem.description).toBe("Buy milk");       
      66 |   });
      67 |

      at Object.toEqual (index.test.js:64:22)

  ● TodoList Basic Operations › should remove an existing todo item correctly

    TypeError: Cannot create property 'id' on string 'Buy eggs'    

      44 |   removeItem(id) {
      45 |     for (let i = 0; i <= this.todoItems.length; i++) {  
    > 46 |       if ((this.todoItems[i].id = id)) {
         |                                ^
      47 |         this.todoItems.splice(i, 1);
      48 |         console.log("Removed Todo with id " + id);      
      49 |         return true;

      at TodoList.removeItem (solution.js:46:32)
      at Object.removeItem (index.test.js:70:26)

  ● TodoList Basic Operations › should not remove a non-existent todo item

    TypeError: Cannot set properties of undefined (setting 'id')   

      44 |   removeItem(id) {
      45 |     for (let i = 0; i <= this.todoItems.length; i++) {  
    > 46 |       if ((this.todoItems[i].id = id)) {
         |                                ^
      47 |         this.todoItems.splice(i, 1);
      48 |         console.log("Removed Todo with id " + id);      
      49 |         return true;

      at TodoList.removeItem (solution.js:46:32)
      at Object.removeItem (index.test.js:77:26)

  ● TodoList Basic Operations › should complete a todo item and update its status

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

      82 |     const newItem = list.addItem("Walk the dog", "2025-12-31", "normal");
      83 |     const completed = list.completeItem(newItem.id);    
    > 84 |     expect(completed).toBe(true);
         |                       ^
      85 |     expect(newItem.isComplete).toBe(true);
      86 |   });
      87 |

      at Object.toBe (index.test.js:84:23)

  ● TodoList Basic Operations › should return only incomplete todo items

    expect(received).toBe(expected) // Object.is equality

    Expected: 1
    Received: 0

      91 |     list.completeItem(item1.id);
      92 |     const incompleteItems = list.getIncompleteItems();  
    > 93 |     expect(incompleteItems.length).toBe(1);
         |                                    ^
      94 |     expect(incompleteItems[0].id).toBe(item2.id);       
      95 |   });
      96 |

      at Object.toBe (index.test.js:93:36)

  ● TodoList Basic Operations › should update the description of an existing todo item

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

      105 |     const newItem = list.addItem("Old Description", null, "normal");
      106 |     const updated = list.updateItem(newItem.id, "New Description");
    > 107 |     expect(updated).toBe(true);
          |                     ^
      108 |     expect(newItem.description).toBe("New Description");
      109 |   });
      110 |

      at Object.toBe (index.test.js:107:21)

  ● TodoList Basic Operations › should find a todo item correctly by id

    expect(received).toEqual(expected) // deep equality

    Expected: {"desc": "Find me", "dueDate": null, "id": 0, "isComplete": "false", "priority": "normal"}
    Received: "Find me"

      112 |     const newItem = list.addItem("Find me", null, "normal");
      113 |     const found = list.findItem(newItem.id);
    > 114 |     expect(found).toEqual(newItem);
          |                   ^
      115 |   });
      116 |
      117 |   test("should sort items by priority", () => {        

      at Object.toEqual (index.test.js:114:19)

  ● TodoList Basic Operations › should sort items by priority      

    expect(received).toBe(expected) // Object.is equality

    Expected: "high"
    Received: undefined

      121 |     list.sortByPriority();
      122 |     const sorted = list.getAllItems();
    > 123 |     expect(sorted[0].priority).toBe("high");
          |                                ^
      124 |     expect(sorted[1].priority).toBe("normal");
      125 |     expect(sorted[2].priority).toBe("low");
      126 |   });

      at Object.toBe (index.test.js:123:32)

  ● ExtendedTodoList Advanced Features › should duplicate a todo item with a new unique id

    expect(received).not.toBeNull()

    Received: null

      136 |     const original = extList.addItem("Original Task", "2025-12-31", "normal");
      137 |     const duplicate = extList.duplicateItem(original.id);
    > 138 |     expect(duplicate).not.toBeNull();
          |                           ^
      139 |     // The test expects a new unique id but the bug copies the same id.
      140 |     expect(duplicate.id).not.toBe(original.id);        
      141 |     expect(duplicate.desc).toBe(original.desc);        

      at Object.toBeNull (index.test.js:138:27)

  ● ExtendedTodoList Advanced Features › should clear all completed todo items

    TypeError: Cannot create property 'isComplete' on string 'Task 1'

      112 |   clearCompleted() {
      113 |     for (let i = 0; i < this.todoItems.length; i++) {  
    > 114 |       if ((this.todoItems[i].isComplete = true)) {     
          |                                        ^
      115 |         this.todoItems.splice(i, 1);
      116 |       }
      117 |     }

      at ExtendedTodoList.clearCompleted (solution.js:114:40)      
      at Object.clearCompleted (index.test.js:149:13)

  ● ExtendedTodoList Advanced Features › should return the correct count of todo items

    expect(received).toBe(expected) // Object.is equality

    Expected: 3
    Received: undefined

      159 |     extList.addItem("Task 2", null, "normal");
      160 |     extList.addItem("Task 3", null, "normal");
    > 161 |     expect(extList.countItems()).toBe(3);
          |                                  ^
      162 |   });
      163 | });
      164 |

      at Object.toBe (index.test.js:161:34)
```
Prompt:
The code provided  is for a Todo List  for a client but some functionalities do not work. The code doesn't work as required due to some bugs. The bugs range from incorrect property handling and faulty id generation to improper data type usage and flawed array management. Specifically:
	-	The `TodoItem` class methods `markComplete` and `markIncomplete` are not updating the completion status correctly.
	-	The `addItem` method in the TodoList class incorrectly pushes a string instead of a TodoItem object, and id generation is flawed if items are removed.
	-	The `removeItem` method uses incorrect loop conditions and assignment in its if condition.
	-	The completeItem, getIncompleteItems, and `updateItem` methods operate on an array that may not contain the proper TodoItem objects.
	•	The `ExtendedTodoList` class has bugs in `duplicateItem`, clearCompleted, and countItems that compromise functionality and uniqueness of items.
	-	And  there are validation issues, logging inconsistencies, and type coercion problems throughout the code.

Please check the implementation and fix all the bugs. Ensure that each method behaves as expected, maintains data consistency, and that the unit tests (provided in the stack trace above) pass successfully. Provide a corrected version of the code along with an updated unit test suite that fully validates the functionality of the Todo List system.
