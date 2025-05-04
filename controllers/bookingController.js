const pool = require("../utils/db");



// ✅ Unauthenticated — anyone can create a booking
exports.createBooking = async (req, res) => {
  console.log("body",req);
  const client_id = req.client.id; 
  const {
    hotel_id,
    guest_name,  // Combined name
    guest_email, // Added guest_email
    check_in,
    check_out,
    total_price,
    payment_id
  } = req.body;

  // Validate input
  if (!hotel_id || !check_in || !check_out || !total_price || !payment_id || !guest_name || !client_id || !guest_email) {
    return res.status(400).json({ success: false, message: 'Missing required booking fields.' });
  }

  try {
    // Insert into bookings table
    const [bookingResult] = await pool.query(
      `INSERT INTO bookings (hotel_id, check_in, check_out, total_price, payment_id, client_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [hotel_id, check_in, check_out, total_price, payment_id, client_id]
    );

    const bookingId = bookingResult.insertId;

    // Insert into booking_guests table with guest's full name and email
    await pool.query(
      `INSERT INTO booking_guests (booking_id, name, email)
       VALUES (?, ?, ?)`,
      [bookingId, guest_name, guest_email]
    );

    // Respond with success and the created booking ID
    return res.status(201).json({ success: true, bookingId });
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({ success: false, message: 'Booking failed.' });
  }
};





// ✅ Authenticated — only return bookings belonging to this admin
// ✅ Authenticated — only return bookings belonging to this admin
exports.getAllBookings = async (req, res) => {
  try {
    const adminId = req.admin?.id;

    const [bookings] = await pool.query(
      `SELECT b.*, b.client_id, g.name AS guest_name, g.email AS guest_email
       FROM bookings b
       JOIN listings l ON b.hotel_id = l.id
       JOIN booking_guests g ON b.id = g.booking_id
       WHERE l.admin_id = ?
       ORDER BY b.created_at DESC`,
      [adminId]
    );

    // Split the guest_name into first and last names if needed
    // const bookingsWithGuestNameSplit = bookings.map(booking => {
    //   const [firstName, lastName] = booking.guest_name.split(' ');
    //   return {
    //     ...booking,
    //     guest_first_name: firstName,
    //     guest_last_name: lastName,
    //   };
    // });

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

    const [rows] = await pool.query(
      `SELECT b.*, b.client_id, g.name AS guest_name, g.email AS guest_email
       FROM bookings b
       LEFT JOIN booking_guests g ON b.id = g.booking_id
       WHERE b.id = ?`,
      [id]
    );

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
