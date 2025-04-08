const express = require("express");
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingsByLocation,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require("../controllers/bookingController");
const verifyAdmin = require("../middleware/authMiddleware");

// Public Routes
router.post("/", createBooking);
// router.get("/location/:location", getBookingsByLocation);
router.get("/:id", getBookingById);

// Protected Routes
router.get("/", verifyAdmin, getAllBookings);
router.put("/:id", verifyAdmin, updateBooking);
router.delete("/:id", verifyAdmin, deleteBooking);

module.exports = router;
