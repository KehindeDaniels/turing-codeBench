class BookingSystem {
  constructor(totalSlots) {
    this.totalSlots = totalSlots;
    this.slots = [];
    for (let i = 1; i <= totalSlots; i++) {
      this.slots.push({
        id: i,
        bookedBy: null,
        bookingTime: null,
        status: "active",
      });
    }
    this.locks = new Array(totalSlots).fill(false);
  }

  bookSlot(userId, slotId) {
    if (slotId <= 0 || slotId > this.totalSlots) {
      throw new Error("Invalid slot ID");
    }

    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.bookedBy !== null || slot.status !== "active") {
      throw new Error("Slot is not available");
    }

    if (this.locks[slotId - 1]) {
      throw new Error("Slot is locked");
    }

    this.locks[slotId - 1] = true;
    setTimeout(() => {
      slot.bookedBy = userId;
      slot.bookingTime = Date.now();
      this.locks[slotId - 1] = false;
    }, 100);

    return true;
  }

  cancelBooking(userId, slotId) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.bookedBy !== userId) {
      throw new Error("User did not book this slot");
    }

    slot.bookedBy = null;
    slot.status = "cancelled";
    return true;
  }

  rebookCancelledSlot(userId, slotId) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.status !== "cancelled") {
      throw new Error("Slot is not cancelled");
    }

    slot.bookedBy = userId;
    slot.status = "active";
    slot.bookingTime = Date.now();
    return true;
  }

  getAvailableSlots() {
    return this.slots.filter(
      (slot) => slot.bookedBy === null && slot.status === "active"
    );
  }

  getBookedSlots() {
    return this.slots.filter(
      (slot) => slot.bookedBy !== null && slot.status === "active"
    );
  }

  getUserBookings(userId) {
    return this.slots.filter((slot) => slot.bookedBy === userId);
  }

  transferBooking(oldUserId, newUserId, slotId) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.bookedBy !== oldUserId) {
      throw new Error("Booking does not belong to the old user");
    }

    const originalTime = slot.bookingTime;
    slot.bookedBy = newUserId;
    slot.bookingTime = originalTime;
    return true;
  }

  resetBookings() {
    this.slots.forEach((slot) => {
      slot.bookedBy = null;
      slot.bookingTime = null;
      slot.status = "active";
    });
    return true;
  }

  updateBooking(slotId, newBookingTime) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.bookedBy === null) {
      throw new Error("Slot is not booked");
    }

    slot.bookingTime = newBookingTime;
    return true;
  }
}

module.exports = { BookingSystem };
