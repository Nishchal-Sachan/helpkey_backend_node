const pool = require("../utils/db");

// ✅ Unauthenticated — anyone can create a booking
exports.createBooking = async (req, res) => {
  try {
    const { hotel_id, guest_name, check_in, check_out } = req.body;

    if (!hotel_id || !guest_name || !check_in || !check_out) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO bookings (hotel_id, guest_name, check_in, check_out) VALUES (?, ?, ?, ?)`,
      [hotel_id, guest_name, check_in, check_out]
    );

    res.status(201).json({
      success: true,
      bookingId: result.insertId,
      message: "Booking created successfully",
    });
  } catch (err) {
    console.error("Create Booking Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ✅ Authenticated — only return bookings belonging to this admin
exports.getAllBookings = async (req, res) => {
  try {
    const adminId = req.admin?.id;


    const [bookings] = await pool.query(
      `SELECT b.* FROM bookings b
       JOIN listings l ON b.hotel_id = l.id
       WHERE l.admin_id = ?
       ORDER BY b.created_at DESC`,
      [adminId]
    );

    res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    console.error("Get Bookings Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ✅ Get single booking by ID — no auth required
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Get Booking Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// // Public — Get bookings by location
// exports.getBookingsByLocation = async (req, res) => {
//   try {
//     const { location } = req.params;

//     const [bookings] = await pool.query(
//       `SELECT b.* FROM bookings b
//        JOIN listings l ON b.hotel_id = l.id
//        WHERE l.location = ?`,
//       [location]
//     );

//     res.status(200).json({ success: true, data: bookings });
//   } catch (err) {
//     console.error("Get Bookings By Location Error:", err);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// };


// ✅ Authenticated — update only bookings belonging to this admin
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { guest_name, check_in, check_out, status } = req.body;
    const adminId = req.admin?.id;


    const [bookingRows] = await pool.query(
      `SELECT b.id, l.admin_id
       FROM bookings b
       JOIN listings l ON b.hotel_id = l.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookingRows.length === 0 || bookingRows[0].admin_id !== adminId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const [result] = await pool.query(
      `UPDATE bookings SET 
         guest_name = COALESCE(?, guest_name), 
         check_in = COALESCE(?, check_in), 
         check_out = COALESCE(?, check_out),
         status = COALESCE(?, status)
       WHERE id = ?`,
      [guest_name, check_in, check_out, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "No changes made" });
    }

    res.status(200).json({ success: true, message: "Booking updated successfully" });
  } catch (err) {
    console.error("Update Booking Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ✅ Authenticated — only allow admin to delete their own bookings
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id;


    const [bookingRows] = await pool.query(
      `SELECT b.id, l.admin_id
       FROM bookings b
       JOIN listings l ON b.hotel_id = l.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookingRows.length === 0 || bookingRows[0].admin_id !== adminId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const [result] = await pool.query("DELETE FROM bookings WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    res.status(200).json({ success: true, message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Delete Booking Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
