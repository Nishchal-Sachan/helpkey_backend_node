const express = require("express");
const router = express.Router();
const { getAllAmenities } = require("../controllers/amenitiesController");

// Get all predefined amenities
router.get("/", getAllAmenities);

module.exports = router;
