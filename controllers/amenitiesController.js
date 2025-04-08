const pool = require("../utils/db");

exports.getAllAmenities = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM amenities");
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Get Amenities Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
