// bookingSystem.test.js
const { BookingSystem } = require("./solution");

jest.useFakeTimers();

describe("BookingSystem", () => {
  let system;

  beforeEach(() => {
    system = new BookingSystem(5);
  });

  //  available slots count should equal totalSlots
  test("should initialize with the correct number of available slots", () => {
    const available = system.getAvailableSlots();
    expect(available.length).toBe(5);
  });

  // book a valid slot returns true
  test("should successfully book an available slot", () => {
    const result = system.bookSlot("user1", 2);
    expect(result).toBe(true);
  });

  test("should mark slot as booked after asynchronous delay", () => {
    system.bookSlot("user2", 3);
    // Initially, the slot should still be available
    let slot = system.slots.find((s) => s.id === 3);
    expect(slot.bookedBy).toBe(null);
    // Fast-forward timers
    jest.advanceTimersByTime(150);
    expect(slot.bookedBy).toBe("user2");
  });

  //non-existing slot should throw an error
  test("should throw an error if booking a slot that doesn't exist", () => {
    expect(() => system.bookSlot("user1", 999)).toThrow();
  });

  // Booking an already booked slot should throw an error
  test("should throw an error if booking an already booked slot", () => {
    system.bookSlot("user1", 1);
    jest.advanceTimersByTime(150);
    expect(() => system.bookSlot("user2", 1)).toThrow();
  });

  test("should cancel a booking successfully if done by the same user", () => {
    system.bookSlot("user3", 4);
    jest.advanceTimersByTime(150);
    const result = system.cancelBooking("user3", 4);
    expect(result).toBe(true);
  });

  test("should throw an error when cancelling a slot not booked by the user", () => {
    system.bookSlot("user1", 2);
    jest.advanceTimersByTime(150);
    expect(() => system.cancelBooking("user2", 2)).toThrow();
  });

  // After cancellation, the slot should be available (but cancelled status not null)
  test("cancelled slot should be available for booking again", () => {
    system.bookSlot("user1", 5);
    jest.advanceTimersByTime(150);
    system.cancelBooking("user1", 5);
    const available = system.getAvailableSlots();
    // Expect slot 5 to be in available list (slot remains "cancelled")
    expect(available.find((s) => s.id === 5)).toBeDefined();
  });

  // a rebook a slot that was cancelled
  test("should allow rebooking of a cancelled slot", () => {
    system.bookSlot("user1", 2);
    jest.advanceTimersByTime(150);
    system.cancelBooking("user1", 2);
    const result = system.rebookCancelledSlot("user2", 2);
    expect(result).toBe(true);
    const slot = system.slots.find((s) => s.id === 2);
    expect(slot.bookedBy).toBe("user2");
  });

  test("should return only actively booked slots", () => {
    system.bookSlot("user1", 1);
    system.bookSlot("user2", 2);
    jest.advanceTimersByTime(150);
    system.cancelBooking("user1", 1);
    const booked = system.getBookedSlots();
    // Expect only slot 2 to be considered booked
    expect(booked.length).toBe(1);
    expect(booked[0].id).toBe(2);
  });

  test("should return all bookings for a specific user", () => {
    system.bookSlot("user1", 1);
    system.bookSlot("user1", 3);
    jest.advanceTimersByTime(150);
    const userBookings = system.getUserBookings("user1");
    expect(userBookings.length).toBe(2);
    expect(userBookings.map((s) => s.id)).toEqual(
      expect.arrayContaining([1, 3])
    );
  });

  // transferring a booking from one user to another should succeed
  test("should transfer a booking from one user to another", () => {
    system.bookSlot("user1", 4);
    jest.advanceTimersByTime(150);
    const result = system.transferBooking("user1", "user2", 4);
    expect(result).toBe(true);
    const slot = system.slots.find((s) => s.id === 4);
    expect(slot.bookedBy).toBe("user2");
  });

  test("should throw an error when transferring a booking that doesn't belong to the old user", () => {
    system.bookSlot("user1", 3);
    jest.advanceTimersByTime(150);
    expect(() => system.transferBooking("user2", "user3", 3)).toThrow();
  });

  // pdating booking time should change the bookingTime property
  test("should update the booking time for a slot", () => {
    system.bookSlot("user1", 2);
    jest.advanceTimersByTime(150);
    const newTime = Date.now() + 10000;
    const result = system.updateBooking(2, newTime);
    expect(result).toBe(true);
    const slot = system.slots.find((s) => s.id === 2);
    expect(slot.bookingTime).toBe(newTime);
  });

  // 15. Reset bookings: after reset, all slots should be available
  test("should reset all bookings to available", () => {
    system.bookSlot("user1", 1);
    system.bookSlot("user2", 2);
    jest.advanceTimersByTime(150);
    system.resetBookings();
    const available = system.getAvailableSlots();
    expect(available.length).toBe(5);
  });

  test("should throw error for invalid slot id (0)", () => {
    expect(() => system.bookSlot("user1", 0)).toThrow();
  });

  test("should throw error for invalid slot id (negative)", () => {
    expect(() => system.bookSlot("user1", -1)).toThrow();
  });

  test("should throw error if booking is attempted while slot is locked", () => {
    // First booking call locks the slot
    system.bookSlot("user1", 3);
    expect(() => system.bookSlot("user2", 3)).toThrow();
    jest.advanceTimersByTime(150);
  });

  test("should throw an error if attempting to rebook a slot that is not cancelled", () => {
    system.bookSlot("user1", 4);
    jest.advanceTimersByTime(150);
    expect(() => system.rebookCancelledSlot("user2", 4)).toThrow();
  });

  test("should not update bookingTime when transferring booking", () => {
    system.bookSlot("user1", 2);
    jest.advanceTimersByTime(150);
    const originalTime = system.slots.find((s) => s.id === 2).bookingTime;
    system.transferBooking("user1", "user3", 2);
    const updatedTime = system.slots.find((s) => s.id === 2).bookingTime;
    // Expect bookingTime to remain unchanged after transfer
    expect(updatedTime).toBe(originalTime);
  });

  // Validate that getBookedSlots ignores cancelled slots even if rebooked incorrectly
  test("should not return cancelled slots in booked slots", () => {
    system.bookSlot("user1", 5);
    jest.advanceTimersByTime(150);
    system.cancelBooking("user1", 5);
    const booked = system.getBookedSlots();
    // Even if rebookCancelledSlot is not called, cancelled slot should not appear in booked list
    expect(booked.find((s) => s.id === 5)).toBeUndefined();
  });
});
