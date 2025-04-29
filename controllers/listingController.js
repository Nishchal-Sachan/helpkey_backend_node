const pool = require("../utils/db");
const verifyAdmin = require("../middleware/authMiddleware");

// GET all listings
exports.getListings = async (req, res) => {
  const { location } = req.query;

  try {
    let query = "SELECT * FROM listings";
    let queryParams = [];

    if (location) {
      query += " WHERE location = ?";
      queryParams.push(location);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await pool.query(query, queryParams);
    const [detailsRows] = await pool.query("SELECT details FROM listing_details WHERE listing_id = ?", [id]);
    const details = detailsRows.length > 0 ? detailsRows[0].details : null;

    // res.status(200).json({ success: true, listing: rows[0], details });
    res.status(200).json({ success: true, listings: rows,details });
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};


// GET single listing by ID (with details)
exports.getListingById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM listings WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Listing not found" });
    }

    const [detailsRows] = await pool.query("SELECT details FROM listing_details WHERE listing_id = ?", [id]);
    const details = detailsRows.length > 0 ? detailsRows[0].details : null;

    res.status(200).json({ success: true, listing: rows[0], details });
  } catch (err) {
    console.error("Error fetching listing:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.getListingsByAdmin = async (req, res) => {
  try {
    const adminId = req.admin?.id;

    // Fetch listings by admin
    const [listings] = await pool.query("SELECT * FROM listings WHERE admin_id = ?", [adminId]);

    // Fetch dynamic details (hotelDetails or other) for each listing
    const listingIds = listings.map(listing => listing.id);

    let detailsMap = {};
    if (listingIds.length > 0) {
      const [detailsRows] = await pool.query(
        `SELECT listing_id, details FROM listing_details WHERE listing_id IN (${listingIds.map(() => '?').join(',')})`,
        listingIds
      );

      detailsRows.forEach(row => {
        detailsMap[row.listing_id] = row.details;
      });
    }

    // Parse amenities and attach details
    listings.forEach(listing => {
      try {
        listing.amenities = JSON.parse(listing.amenities);
      } catch {
        listing.amenities = [];
      }

      listing.details = detailsMap[listing.id] || null;
    });

    res.json({ success: true, data: listings });
  } catch (err) {
    console.error("GET Admin Listings Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.createListing = async (req, res) => {
  console.log(req.body);
  const adminId = req.admin?.id;
  const {
    title, description, location, image_url,
    amenities, property_type, beds, bathrooms, guests,
    category, discount, room_type, number_of_rooms, floor_no, 
    villa_details, hotel_details
  } = req.body;

  // Ensure the required static fields are present
  if (!title || !location || !property_type || !category) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    // Insert static data into the 'listings' table
    const [result] = await pool.query(
      `INSERT INTO listings 
        (title, description, location, property_type, place_category, admin_id) 
        VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title, description, location, property_type,
        category, adminId,
      ]
    );

    const listingId = result.insertId;

    // Prepare dynamic fields to be stored in the 'listing_details' table
    const listingDetails = {};

    // Include dynamic fields based on the property type
    if (image_url) listingDetails.image_url = image_url;
    if (amenities) listingDetails.amenities = amenities;
    if (beds) listingDetails.beds = beds;
    if (bathrooms) listingDetails.bathrooms = bathrooms;
    if (guests) listingDetails.guests = guests;
    if (discount) listingDetails.discount = discount;

    // Specific fields for each property type
    if (property_type === "hotel") {
      if (room_type) listingDetails.room_type = room_type;
      if (number_of_rooms) listingDetails.number_of_rooms = number_of_rooms;
      if (floor_no) listingDetails.floor_no = floor_no;
      if (hotel_details) listingDetails.hotel_details = hotel_details;
    }

    if (property_type === "hostel") {
      if (room_type) listingDetails.room_type = room_type;
      if (number_of_rooms) listingDetails.number_of_rooms = number_of_rooms;
      if (floor_no) listingDetails.floor_no = floor_no;
    }

    if (property_type === "apartment") {
      if (number_of_rooms) listingDetails.number_of_rooms = number_of_rooms;
      if (floor_no) listingDetails.floor_no = floor_no;
    }

    if (property_type === "villa") {
      if (villa_details) listingDetails.villa_details = villa_details;
      if (number_of_rooms) listingDetails.number_of_rooms = number_of_rooms;
      if (bathrooms) listingDetails.bathrooms = bathrooms;
      if (price) listingDetails.price = price;
    }

    // Insert dynamic data into the 'listing_details' table as JSON
    await pool.query(
      "INSERT INTO listing_details (listing_id, details) VALUES (?, ?)",
      [listingId, JSON.stringify(listingDetails)]
    );

    // Return success response
    res.status(201).json({ success: true, message: "Listing created successfully", listingId });
  } catch (err) {
    console.error("Error creating listing:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// UPDATE Listings
exports.updateListing = async (req, res) => {
  console.log(req.body);
  const adminId = req.admin?.id;
  const { 
    listingId, title, description, location, image_url,
    amenities, property_type, beds, bathrooms, guests,
    place_category, discount, room_type, number_of_rooms, floor_no,
    villa_details, hotel_details, price
  } = req.body;

  // Ensure the required static fields and listingId are present
  if (!listingId || !title || !location || !property_type || !place_category) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    // Update static data in the 'listings' table
    const [result] = await pool.query(
      `UPDATE listings 
       SET title = ?, description = ?, location = ?, property_type = ?, place_category = ? 
       WHERE id = ? AND admin_id = ?`,
      [title, description, location, property_type, place_category, listingId, adminId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Listing not found or not authorized" });
    }

    // Prepare dynamic fields to be updated in the 'listing_details' table
    const listingDetails = {};

    // Include dynamic fields based on the property type
    if (image_url) listingDetails.image_url = image_url;
    if (amenities) listingDetails.amenities = amenities;
    if (beds) listingDetails.beds = beds;
    if (bathrooms) listingDetails.bathrooms = bathrooms;
    if (guests) listingDetails.guests = guests;
    if (discount) listingDetails.discount = discount;

    // Specific fields for each property type
    if (property_type === "hotel") {
      if (room_type) listingDetails.room_type = room_type;
      if (number_of_rooms) listingDetails.number_of_rooms = number_of_rooms;
      if (floor_no) listingDetails.floor_no = floor_no;
      if (hotel_details) listingDetails.hotel_details = hotel_details;
    }

    if (property_type === "hostel") {
      if (room_type) listingDetails.room_type = room_type;
      if (number_of_rooms) listingDetails.number_of_rooms = number_of_rooms;
      if (floor_no) listingDetails.floor_no = floor_no;
    }

    if (property_type === "apartment") {
      if (number_of_rooms) listingDetails.number_of_rooms = number_of_rooms;
      if (floor_no) listingDetails.floor_no = floor_no;
    }

    if (property_type === "villa") {
      if (villa_details) listingDetails.villa_details = villa_details;
      if (number_of_rooms) listingDetails.number_of_rooms = number_of_rooms;
      if (bathrooms) listingDetails.bathrooms = bathrooms;
      if (price) listingDetails.price = price;
    }

    // Update dynamic data in the 'listing_details' table
    await pool.query(
      `UPDATE listing_details 
       SET details = ? 
       WHERE listing_id = ?`,
      [JSON.stringify(listingDetails), listingId]
    );

    // Return success response with updated details
    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      listingId,
      listingDetails: listingDetails // Optionally return the updated details
    });

  } catch (err) {
    console.error("Error updating listing:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};



// DELETE listing
exports.deleteListing = async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin?.id;

  try {
    const [rows] = await pool.query("SELECT * FROM listings WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Listing not found" });
    }

    if (rows[0].admin_id !== adminId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    await pool.query("DELETE FROM listing_details WHERE listing_id = ?", [id]);
    await pool.query("DELETE FROM listings WHERE id = ?", [id]);

    res.status(200).json({ success: true, message: "Listing deleted successfully" });
  } catch (err) {
    console.error("Error deleting listing:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
