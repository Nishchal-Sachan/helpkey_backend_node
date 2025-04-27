// const pool = require("../utils/db");
// const verifyAdmin = require("../middleware/authMiddleware");

// // GET listings by optional location (Public Route)
// exports.getListings = async (req, res) => {
//   try {
//     const location = req.query.location;
//     let query = "SELECT * FROM listings";
//     const values = [];

//     if (location) {
//       query += " WHERE location LIKE ?";
//       values.push(`%${location}%`);
//     }

//     const [rows] = await pool.query(query, values);

//     const listings = rows.map((listing) => ({
//       ...listing,
//       amenities: JSON.parse(listing.amenities || "[]"),
//     }));

//     res.json({ success: true, data: listings });
//   } catch (error) {
//     console.error("GET Listings Error:", error);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// };

// // GET listing by ID (Public Route)
// exports.getListingById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Join listings with hotel_details on id
//     const [rows] = await pool.query(
//       `
//       SELECT 
//         l.*, 
//         h.num_rooms AS rooms,
//         h.room_types
//       FROM listings l
//       LEFT JOIN hotel_details h ON l.id = h.listing_id
//       WHERE l.id = ?
//       `,
//       [id]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ success: false, error: "Listing not found" });
//     }

//     const listing = rows[0];

//     // Parse amenities
//     try {
//       listing.amenities = JSON.parse(listing.amenities || "[]");
//     } catch {
//       listing.amenities = [];
//     }

//     // Parse room_types
//     try {
//       listing.room_types = JSON.parse(listing.room_types || "[]");
//     } catch {
//       listing.room_types = [];
//     }

//     res.json({ success: true, data: listing });
//   } catch (err) {
//     console.error("GET /listing/:id Error:", err);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// };



// // GET all listings by adminId (Protected Route)
// exports.getListingsByAdmin = async (req, res) => {
//   try {
//     // const { adminId } = await verifyAdmin(req, res);
//     const adminId = req.admin?.id;

//     const [listings] = await pool.query("SELECT * FROM listings WHERE admin_id = ?", [adminId]);

//     listings.forEach((listing) => {
//       try {
//         listing.amenities = JSON.parse(listing.amenities);
//       } catch {
//         listing.amenities = [];
//       }
//     });

//     res.json({ success: true, data: listings });
//   } catch (err) {
//     console.error("GET Admin Listings Error:", err);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// };

// // POST new listing with hotelDetails logic (Protected Route)
// exports.createListing = async (req, res) => {
//   try {
//     // const { adminId } = await verifyAdmin(req, res);
//     const adminId = req.admin?.id;

//     const {
//       title, description, price, location, image_url,
//       amenities, property_type, beds, bathrooms, guests,
//       place_category, discount, hotelDetails,
//     } = req.body;

//     if (!title || !price || !location || !property_type || !place_category) {
//       return res.status(400).json({ success: false, error: "Missing required fields" });
//     }

//     const [result] = await pool.query(
//       `INSERT INTO listings 
//         (title, description, price, location, image_url, amenities, property_type, beds, bathrooms, guests, place_category, discount, admin_id) 
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         title, description, parseFloat(price), location, image_url,
//         JSON.stringify(amenities || []), property_type, parseInt(beds) || 1,
//         parseInt(bathrooms) || 1, parseInt(guests) || 1, place_category,
//         parseFloat(discount) || 0.0, adminId,
//       ]
//     );

//     const listingId = result.insertId;

//     if (property_type.toLowerCase() === "hotel" && hotelDetails) {
//       const { numRooms, roomTypes } = hotelDetails;
//       if (!numRooms || !Array.isArray(roomTypes) || !roomTypes.length) {
//         return res.status(400).json({ success: false, error: "Hotel details are required" });
//       }

//       await pool.query(
//         "INSERT INTO hotel_details (listing_id, num_rooms, room_types) VALUES (?, ?, ?)",
//         [listingId, parseInt(numRooms), JSON.stringify(roomTypes)]
//       );
//     }

//     res.status(201).json({ success: true, message: "Listing added", id: listingId });
//   } catch (err) {
//     console.error("POST Listing Error:", err);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// };

// // PUT update listing (Protected + Ownership Check)
// exports.updateListing = async (req, res) => {
//   try {
//     const { id } = req.params;
//     // const { adminId } = await verifyAdmin(req, res);
//     const adminId = req.admin?.id;


//     const [check] = await pool.query("SELECT * FROM listings WHERE id = ? AND admin_id = ?", [id, adminId]);
//     if (!check.length) {
//       return res.status(403).json({ success: false, error: "Not authorized to update this listing" });
//     }

//     const {
//       title, description, price, location, image_url,
//       amenities, property_type, beds, bathrooms, guests,
//       place_category, discount,
//     } = req.body;

//     await pool.query(
//       `UPDATE listings 
//        SET title = COALESCE(?, title), 
//            description = COALESCE(?, description), 
//            price = COALESCE(?, price), 
//            location = COALESCE(?, location), 
//            image_url = COALESCE(?, image_url), 
//            amenities = COALESCE(?, amenities), 
//            property_type = COALESCE(?, property_type), 
//            beds = COALESCE(?, beds), 
//            bathrooms = COALESCE(?, bathrooms), 
//            guests = COALESCE(?, guests), 
//            place_category = COALESCE(?, place_category), 
//            discount = COALESCE(?, discount)
//        WHERE id = ?`,
//       [
//         title, description, price, location, image_url,
//         amenities ? JSON.stringify(amenities) : null,
//         property_type, beds, bathrooms, guests, place_category, discount, id,
//       ]
//     );

//     res.json({ success: true, message: "Listing updated successfully" });
//   } catch (err) {
//     console.error("PUT Listing Error:", err);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// };

// // DELETE listing (Protected + Ownership Check)
// exports.deleteListing = async (req, res) => {
//   try {
//     const { id } = req.params;
//     // const { adminId } = await verifyAdmin(req, res);
//     const adminId = req.admin?.id;


//     const [check] = await pool.query("SELECT * FROM listings WHERE id = ? AND admin_id = ?", [id, adminId]);
//     if (!check.length) {
//       return res.status(403).json({ success: false, error: "Not authorized to delete this listing" });
//     }

//     await pool.query("DELETE FROM listings WHERE id = ?", [id]);
//     res.json({ success: true, message: "Listing deleted successfully" });
//   } catch (err) {
//     console.error("DELETE Listing Error:", err);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// };



const pool = require("../utils/db");
const verifyAdmin = require("../middleware/authMiddleware");

// GET all listings
exports.getListings = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM listings ORDER BY created_at DESC");
    res.status(200).json({ success: true, listings: rows });
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


// CREATE listing
// exports.createListing = async (req, res) => {
//   const adminId = req.admin?.id;
//   const {
//     title, description, location, image_url,
//     amenities, property_type, beds, bathrooms, guests,
//     place_category, discount, hotelDetails,
//   } = req.body;

//   if (!title || !location || !property_type || !place_category) {
//     return res.status(400).json({ success: false, error: "Missing required fields" });
//   }

//   try {
//     const [result] = await pool.query(
//       `INSERT INTO listings 
//         (title, description, location, image_url, amenities, property_type, beds, bathrooms, guests, place_category, discount, admin_id) 
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         title, description, location, image_url,
//         JSON.stringify(amenities || []), property_type,
//         parseInt(beds) || 1, parseInt(bathrooms) || 1,
//         parseInt(guests) || 1, place_category,
//         parseFloat(discount) || 0.0, adminId,
//       ]
//     );

//     const listingId = result.insertId;

//     if (hotelDetails && typeof hotelDetails === "object") {
//       await pool.query(
//         "INSERT INTO listing_details (listing_id, details) VALUES (?, ?)",
//         [listingId, JSON.stringify(hotelDetails)]
//       );
//     }

//     res.status(201).json({ success: true, message: "Listing created successfully", listingId });
//   } catch (err) {
//     console.error("Error creating listing:", err);
//     res.status(500).json({ success: false, error: "Internal server error" });
//   }
// };

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


// UPDATE listing
// exports.updateListing = async (req, res) => {
//   const { id } = req.params;
//   const adminId = req.admin?.id;
//   const {
//     title, description, location, image_url,
//     amenities, property_type, beds, bathrooms, guests,
//     place_category, discount, hotelDetails,
//   } = req.body;

//   try {
//     const [existingRows] = await pool.query("SELECT * FROM listings WHERE id = ?", [id]);
//     if (existingRows.length === 0) {
//       return res.status(404).json({ success: false, error: "Listing not found" });
//     }

//     if (existingRows[0].admin_id !== adminId) {
//       return res.status(403).json({ success: false, error: "Unauthorized" });
//     }

//     await pool.query(
//       `UPDATE listings SET
//         title = ?, description = ?, location = ?, image_url = ?, amenities = ?, property_type = ?, 
//         beds = ?, bathrooms = ?, guests = ?, place_category = ?, discount = ?
//         WHERE id = ?`,
//       [
//         title, description, location, image_url,
//         JSON.stringify(amenities || []), property_type,
//         parseInt(beds) || 1, parseInt(bathrooms) || 1,
//         parseInt(guests) || 1, place_category,
//         parseFloat(discount) || 0.0, id,
//       ]
//     );

//     if (hotelDetails && typeof hotelDetails === "object") {
//       const [detailsRows] = await pool.query("SELECT * FROM listing_details WHERE listing_id = ?", [id]);
//       if (detailsRows.length > 0) {
//         await pool.query(
//           "UPDATE listing_details SET details = ? WHERE listing_id = ?",
//           [JSON.stringify(hotelDetails), id]
//         );
//       } else {
//         await pool.query(
//           "INSERT INTO listing_details (listing_id, details) VALUES (?, ?)",
//           [id, JSON.stringify(hotelDetails)]
//         );
//       }
//     }

//     res.status(200).json({ success: true, message: "Listing updated successfully" });
//   } catch (err) {
//     console.error("Error updating listing:", err);
//     res.status(500).json({ success: false, error: "Internal server error" });
//   }
// };

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
