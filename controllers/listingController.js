const pool = require("../utils/db");
const verifyAdmin = require("../middleware/authMiddleware");

// GET listings by optional location (Public Route)
exports.getListings = async (req, res) => {
  try {
    const location = req.query.location;
    let query = "SELECT * FROM listings";
    const values = [];

    if (location) {
      query += " WHERE location LIKE ?";
      values.push(`%${location}%`);
    }

    const [rows] = await pool.query(query, values);

    const listings = rows.map((listing) => ({
      ...listing,
      amenities: JSON.parse(listing.amenities || "[]"),
    }));

    res.json({ success: true, data: listings });
  } catch (error) {
    console.error("GET Listings Error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// GET listing by ID (Public Route)
exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM listings WHERE id = ?", [id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, error: "Listing not found" });
    }

    const listing = rows[0];
    try {
      listing.amenities = JSON.parse(listing.amenities);
    } catch {
      listing.amenities = [];
    }

    res.json({ success: true, data: listing });
  } catch (err) {
    console.error("GET /listing/:id Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// GET all listings by adminId (Protected Route)
exports.getListingsByAdmin = async (req, res) => {
  try {
    // const { adminId } = await verifyAdmin(req, res);
    const adminId = req.admin?.id;

    const [listings] = await pool.query("SELECT * FROM listings WHERE admin_id = ?", [adminId]);

    listings.forEach((listing) => {
      try {
        listing.amenities = JSON.parse(listing.amenities);
      } catch {
        listing.amenities = [];
      }
    });

    res.json({ success: true, data: listings });
  } catch (err) {
    console.error("GET Admin Listings Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// POST new listing with hotelDetails logic (Protected Route)
exports.createListing = async (req, res) => {
  try {
    // const { adminId } = await verifyAdmin(req, res);
    const adminId = req.admin?.id;

    const {
      title, description, price, location, image_url,
      amenities, property_type, beds, bathrooms, guests,
      place_category, discount, hotelDetails,
    } = req.body;

    if (!title || !price || !location || !property_type || !place_category) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const [result] = await pool.query(
      `INSERT INTO listings 
        (title, description, price, location, image_url, amenities, property_type, beds, bathrooms, guests, place_category, discount, admin_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, description, parseFloat(price), location, image_url,
        JSON.stringify(amenities || []), property_type, parseInt(beds) || 1,
        parseInt(bathrooms) || 1, parseInt(guests) || 1, place_category,
        parseFloat(discount) || 0.0, adminId,
      ]
    );

    const listingId = result.insertId;

    if (property_type.toLowerCase() === "hotel" && hotelDetails) {
      const { numRooms, roomTypes } = hotelDetails;
      if (!numRooms || !Array.isArray(roomTypes) || !roomTypes.length) {
        return res.status(400).json({ success: false, error: "Hotel details are required" });
      }

      await pool.query(
        "INSERT INTO hotel_details (listing_id, num_rooms, room_types) VALUES (?, ?, ?)",
        [listingId, parseInt(numRooms), JSON.stringify(roomTypes)]
      );
    }

    res.status(201).json({ success: true, message: "Listing added", id: listingId });
  } catch (err) {
    console.error("POST Listing Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// PUT update listing (Protected + Ownership Check)
exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    // const { adminId } = await verifyAdmin(req, res);
    const adminId = req.admin?.id;


    const [check] = await pool.query("SELECT * FROM listings WHERE id = ? AND admin_id = ?", [id, adminId]);
    if (!check.length) {
      return res.status(403).json({ success: false, error: "Not authorized to update this listing" });
    }

    const {
      title, description, price, location, image_url,
      amenities, property_type, beds, bathrooms, guests,
      place_category, discount,
    } = req.body;

    await pool.query(
      `UPDATE listings 
       SET title = COALESCE(?, title), 
           description = COALESCE(?, description), 
           price = COALESCE(?, price), 
           location = COALESCE(?, location), 
           image_url = COALESCE(?, image_url), 
           amenities = COALESCE(?, amenities), 
           property_type = COALESCE(?, property_type), 
           beds = COALESCE(?, beds), 
           bathrooms = COALESCE(?, bathrooms), 
           guests = COALESCE(?, guests), 
           place_category = COALESCE(?, place_category), 
           discount = COALESCE(?, discount)
       WHERE id = ?`,
      [
        title, description, price, location, image_url,
        amenities ? JSON.stringify(amenities) : null,
        property_type, beds, bathrooms, guests, place_category, discount, id,
      ]
    );

    res.json({ success: true, message: "Listing updated successfully" });
  } catch (err) {
    console.error("PUT Listing Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// DELETE listing (Protected + Ownership Check)
exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    // const { adminId } = await verifyAdmin(req, res);
    const adminId = req.admin?.id;


    const [check] = await pool.query("SELECT * FROM listings WHERE id = ? AND admin_id = ?", [id, adminId]);
    if (!check.length) {
      return res.status(403).json({ success: false, error: "Not authorized to delete this listing" });
    }

    await pool.query("DELETE FROM listings WHERE id = ?", [id]);
    res.json({ success: true, message: "Listing deleted successfully" });
  } catch (err) {
    console.error("DELETE Listing Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
