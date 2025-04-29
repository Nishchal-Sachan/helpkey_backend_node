const express = require("express");
const upload = require('../middleware/upload');
const router = express.Router();
const {
  getListings,
  getListingById,
  getListingsByAdmin,
  createListing,
  updateListing,
  deleteListing,
} = require("../controllers/listingController");
const verifyAdmin = require("../middleware/authMiddleware");


console.log({
  getListings,
  getListingById,
  getListingsByAdmin,
  createListing,
  updateListing,
  deleteListing,
});


// Admin routes FIRST
router.get("/admin/listings", verifyAdmin, getListingsByAdmin); // GET /api/listing/admin/listings

// Public routes
router.get("/", getListings); // GET /api/listing?location=xyz
router.get("/:id", getListingById); // GET /api/listing/:id

// Protected admin actions
router.post("/", verifyAdmin,upload.single('image'), createListing);                   // POST /api/listing
router.put("/:id", verifyAdmin, updateListing);                 // PUT /api/listing/:id
router.delete("/:id", verifyAdmin, deleteListing);              // DELETE /api/listing/:id

module.exports = router;
