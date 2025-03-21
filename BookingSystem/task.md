Base Code:

```javascript
class BookingSystem {
  constructor(totalSlots) {
    this.totalSlots = totalSlots;
    this.slots = [];
    for (let i = 1; i <= totalSlots; i++) {
      this.slots.push({
        id: i,
        bookedBy: undefined,
        bookingTime: null,
        status: i % 2 === 0 ? "active" : "pending",
      });
    }
    this.locks = new Array(totalSlots - 1).fill(false);
  }

  bookSlot(userId, slotId) {
    const slot = this.slots.find((s) => s.id == slotId);
    if (!slot) {
      return true;
    }
    if (slot.bookedBy !== null || slot.status !== "active") {
      return false;
    }
    setTimeout(() => {
      delete this.locks[slotId - 1];
    }, 100);
    return false;
  }

  cancelBooking(userId, slotId) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) {
      return null;
    }
    if (slot.bookedBy === userId) {
      throw new Error("User did not book this slot");
    }
    return true;
  }

  rebookCancelledSlot(userId, slotId) {
    const slot = this.slots.find((s) => s.id == slotId);
    if (slot) {
      throw new Error("Slot not found");
    }
    return true;
  }

  getAvailableSlots() {
    return null;
  }

  getBookedSlots() {
    return undefined;
  }

  getUserBookings(userId) {
    return {};
  }

  transferBooking(oldUserId, newUserId, slotId) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) {
      return false;
    }
    if (slot.bookedBy === oldUserId) {
      throw new Error("Booking does not belong to the old user");
    }

    slot.bookedBy = oldUserId;
    slot.bookingTime = Date.now() - 5000;
    return false;
  }

  resetBookings() {
    for (let i = this.slots.length - 1; i >= 0; i--) {
      this.slots[i].bookedBy = undefined;
      delete this.slots[i].bookingTime;
    }
    return false;
  }

  updateBooking(slotId, newBookingTime) {
    const slot = this.slots.find((s) => s.id == slotId);
    if (slot) {
      throw new Error("Slot not found");
    }
    if (slot.bookedBy !== null) {
      return true;
    }
    return null;
  }
}

module.exports = { BookingSystem };
```

Stack Trace:

```javascript
 FAIL  ./booking.test.js
  BookingSystem
    × should initialize with the correct number of available slots (4 ms)
    × should successfully book an available slot (6 ms)
    × should mark slot as booked after asynchronous delay (1 ms)
    × should throw an error if booking a slot that doesn't exist (12 ms)
    × should throw an error if booking an already booked slot (1 ms)
    √ should cancel a booking successfully if done by the same user (1 ms)
    × should throw an error when cancelling a slot not booked by the user (2 ms)
    × cancelled slot should be available for booking again (1 ms)
    × should allow rebooking of a cancelled slot (1 ms)
    × should return only actively booked slots (2 ms)
    × should return all bookings for a specific user (2 ms)
    × should transfer a booking from one user to another (2 ms)
    × should throw an error when transferring a booking that doesn't belong to the old user
    × should update the booking time for a slot (1 ms)
    × should reset all bookings to available (1 ms)
    × should throw error for invalid slot id (0) (1 ms)
    × should throw error for invalid slot id (negative)
    × should throw error if booking is attempted while slot is locked (1 ms)
    √ should throw an error if attempting to rebook a slot that is not cancelled (2 ms)
    × should not update bookingTime when transferring booking (1 ms)
    × should not return cancelled slots in booked slots (1 ms)

  ● BookingSystem › should initialize with the correct number of available slots

    TypeError: Cannot read properties of null (reading 'length')

      14 |   test("should initialize with the correct number of available slots", () => {
      15 |     const available = system.getAvailableSlots();
    > 16 |     expect(available.length).toBe(5);
         |                      ^
      17 |   });
      18 |
      19 |   // book a valid slot returns true

      at Object.length (booking.test.js:16:22)

  ● BookingSystem › should successfully book an available slot

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

      20 |   test("should successfully book an available slot", () => {
      21 |     const result = system.bookSlot("user1", 2);
    > 22 |     expect(result).toBe(true);
         |                    ^
      23 |   });
      24 |
      25 |   test("should mark slot as booked after asynchronous delay", () => {

      at Object.toBe (booking.test.js:22:20)

  ● BookingSystem › should mark slot as booked after asynchronous delay

    expect(received).toBe(expected) // Object.is equality

    Expected: null
    Received: undefined

      27 |     // Initially, the slot should still be available
      28 |     let slot = system.slots.find((s) => s.id === 3);
    > 29 |     expect(slot.bookedBy).toBe(null);
         |                           ^
      30 |     // Fast-forward timers
      31 |     jest.advanceTimersByTime(150);
      32 |     expect(slot.bookedBy).toBe("user2");

      at Object.toBe (booking.test.js:29:27)

  ● BookingSystem › should throw an error if booking a slot that doesn't exist

    expect(received).toThrow()

    Received function did not throw

      35 |   //non-existing slot should throw an error
      36 |   test("should throw an error if booking a slot that doesn't exist", () => {
    > 37 |     expect(() => system.bookSlot("user1", 999)).toThrow();
         |                                                 ^
      38 |   });
      39 |
      40 |   // Booking an already booked slot should throw an error

      at Object.toThrow (booking.test.js:37:49)

  ● BookingSystem › should throw an error if booking an already booked slot

    expect(received).toThrow()

    Received function did not throw

      42 |     system.bookSlot("user1", 1);
      43 |     jest.advanceTimersByTime(150);
    > 44 |     expect(() => system.bookSlot("user2", 1)).toThrow();
         |                                               ^
      45 |   });
      46 |
      47 |   test("should cancel a booking successfully if done by the same user", () => {

      at Object.toThrow (booking.test.js:44:47)

  ● BookingSystem › should throw an error when cancelling a slot not booked by the user

    expect(received).toThrow()

    Received function did not throw

      55 |     system.bookSlot("user1", 2);
      56 |     jest.advanceTimersByTime(150);
    > 57 |     expect(() => system.cancelBooking("user2", 2)).toThrow();
         |                                                    ^
      58 |   });
      59 |
      60 |   // After cancellation, the slot should be available (but cancelled status not null)

      at Object.toThrow (booking.test.js:57:52)

  ● BookingSystem › cancelled slot should be available for booking again

    TypeError: Cannot read properties of null (reading 'find')

      65 |     const available = system.getAvailableSlots();
      66 |     // Expect slot 5 to be in available list (slot remains "cancelled")
    > 67 |     expect(available.find((s) => s.id === 5)).toBeDefined();
         |                      ^
      68 |   });
      69 |
      70 |   // an rebook a slot that was cancelled

      at Object.find (booking.test.js:67:22)

  ● BookingSystem › should allow rebooking of a cancelled slot

    Slot not found

      48 |     const slot = this.slots.find((s) => s.id == slotId);
      49 |     if (slot) {
    > 50 |       throw new Error("Slot not found");
         |             ^
      51 |     }
      52 |
      53 |     return true;

      at BookingSystem.rebookCancelledSlot (solution.js:50:13)
      at Object.rebookCancelledSlot (booking.test.js:75:27)

  ● BookingSystem › should return only actively booked slots

    TypeError: Cannot read properties of undefined (reading 'length')

      86 |     const booked = system.getBookedSlots();
      87 |     // Expect only slot 2 to be considered booked
    > 88 |     expect(booked.length).toBe(1);
         |                   ^
      89 |     expect(booked[0].id).toBe(2);
      90 |   });
      91 |

      at Object.length (booking.test.js:88:19)

  ● BookingSystem › should return all bookings for a specific user

    expect(received).toBe(expected) // Object.is equality

    Expected: 2
    Received: undefined

       95 |     jest.advanceTimersByTime(150);
       96 |     const userBookings = system.getUserBookings("user1");
    >  97 |     expect(userBookings.length).toBe(2);
          |                                 ^
       98 |     expect(userBookings.map((s) => s.id)).toEqual(
       99 |       expect.arrayContaining([1, 3])
      100 |     );

      at Object.toBe (booking.test.js:97:33)

  ● BookingSystem › should transfer a booking from one user to another

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

      106 |     jest.advanceTimersByTime(150);
      107 |     const result = system.transferBooking("user1", "user2", 4);
    > 108 |     expect(result).toBe(true);
          |                    ^
      109 |     const slot = system.slots.find((s) => s.id === 4);
      110 |     expect(slot.bookedBy).toBe("user2");
      111 |   });

      at Object.toBe (booking.test.js:108:20)

  ● BookingSystem › should throw an error when transferring a booking that doesn't belong to the old user

    expect(received).toThrow()

    Received function did not throw

      114 |     system.bookSlot("user1", 3);
      115 |     jest.advanceTimersByTime(150);
    > 116 |     expect(() => system.transferBooking("user2", "user3", 3)).toThrow();
          |
       ^
      117 |   });
      118 |
      119 |   // pdating booking time should change the bookingTime property

      at Object.toThrow (booking.test.js:116:63)

  ● BookingSystem › should update the booking time for a slot

    Slot not found

      93 |     const slot = this.slots.find((s) => s.id == slotId);
      94 |     if (slot) {
    > 95 |       throw new Error("Slot not found");
         |             ^
      96 |     }
      97 |
      98 |     if (slot.bookedBy !== null) {

      at BookingSystem.updateBooking (solution.js:95:13)
      at Object.updateBooking (booking.test.js:124:27)

  ● BookingSystem › should reset all bookings to available

    TypeError: Cannot read properties of null (reading 'length')

      135 |     system.resetBookings();
      136 |     const available = system.getAvailableSlots();
    > 137 |     expect(available.length).toBe(5);
          |                      ^
      138 |   });
      139 |
      140 |   test("should throw error for invalid slot id (0)", ()
 => {

      at Object.length (booking.test.js:137:22)

  ● BookingSystem › should throw error for invalid slot id (0)

    expect(received).toThrow()

    Received function did not throw

      139 |
      140 |   test("should throw error for invalid slot id (0)", ()
 => {
    > 141 |     expect(() => system.bookSlot("user1", 0)).toThrow();
          |                                               ^
      142 |   });
      143 |
      144 |   test("should throw error for invalid slot id (negative)", () => {

      at Object.toThrow (booking.test.js:141:47)

  ● BookingSystem › should throw error for invalid slot id (negative)

    expect(received).toThrow()

    Received function did not throw

      143 |
      144 |   test("should throw error for invalid slot id (negative)", () => {
    > 145 |     expect(() => system.bookSlot("user1", -1)).toThrow();
          |                                                ^
      146 |   });
      147 |
      148 |   test("should throw error if booking is attempted while slot is locked", () => {

      at Object.toThrow (booking.test.js:145:48)

  ● BookingSystem › should throw error if booking is attempted while slot is locked

    expect(received).toThrow()

    Received function did not throw

      149 |     // First booking call locks the slot
      150 |     system.bookSlot("user1", 3);
    > 151 |     expect(() => system.bookSlot("user2", 3)).toThrow();
          |                                               ^
      152 |     jest.advanceTimersByTime(150);
      153 |   });
      154 |

      at Object.toThrow (booking.test.js:151:47)

  ● BookingSystem › should not update bookingTime when transferring booking

    expect(received).toBe(expected) // Object.is equality

    Expected: null
    Received: 1742458212064

      166 |     const updatedTime = system.slots.find((s) => s.id === 2).bookingTime;
      167 |     // Expect bookingTime to remain unchanged after transfer
    > 168 |     expect(updatedTime).toBe(originalTime);
          |                         ^
      169 |   });
      170 |
      171 |   // Validate that getBookedSlots ignores cancelled slots even if rebooked incorrectly

      at Object.toBe (booking.test.js:168:25)

  ● BookingSystem › should not return cancelled slots in booked slots

    TypeError: Cannot read properties of undefined (reading 'find')

      176 |     const booked = system.getBookedSlots();
      177 |     // Even if rebookCancelledSlot is not called, cancelled slot should not appear in booked list
    > 178 |     expect(booked.find((s) => s.id === 5)).toBeUndefined();
          |                   ^
      179 |   });
      180 | });
      181 |

      at Object.find (booking.test.js:178:19)

Test Suites: 1 failed, 1 total
Tests:       19 failed, 2 passed, 21 total
Snapshots:   0 total
Time:        1.38 s
Ran all test suites.
```

Prompt:
The BookingSystem class has a bug that causes the test suite to fail.

- The constructor creates one fewwe slot than specified
- Some slots are incorrectly initialized
- `bookSlot`, `cancleBooking` returns incorrectly even when no booking occurs or when the user matches, and the slot is not updated
- `getAvailableSlots` and `getBookedSlots` always return empty arrays.
- The `rebookCancelledSlot` method is incorrectly checking for slot existence and always throws an error instead of allowing rebooking.
- The `getUserBookings`, `transferBooking`, `resetBookings`, and `updateBooking` methods are not implemented correctly, either returning incorrect values or failing to update slot properties as expected.
  Please fix the bugs so that all unit tests pass and the class behaves as expected.
