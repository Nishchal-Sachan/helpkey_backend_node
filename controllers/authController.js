const pool = require("../utils/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Signup Admin
exports.signupAdmin = async (req, res) => {
  const { first_name, last_name, email, phone_number, password, role } = req.body;

  if (!first_name || !last_name || !email || !password || !phone_number) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    const [existingUsers] = await pool.query(
      "SELECT id, email, phone_number FROM admin_users WHERE email = ? OR phone_number = ?",
      [email, phone_number]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      const duplicateField = existingUser.email === email ? "Email" : "Phone number";
      return res.status(400).json({ success: false, error: `${duplicateField} already in use` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO admin_users (first_name, last_name, email, phone_number, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)",
      [first_name, last_name, email, phone_number, hashedPassword, role || "admin"]
    );

    const newUserId = result.insertId;

    const token = jwt.sign(
      { id: newUserId, email, role: role || "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(201).json({ success: true, message: "Signup successful" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Login Admin
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM admin_users WHERE email = ?", [email]);
    const admin = rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({ success: true, message: "Login successful" });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Logout Admin
exports.logoutAdmin = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// Auth Check
exports.getAuthUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      "SELECT id, email, first_name, last_name, role FROM admin_users WHERE id = ?",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Admin not found" });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Auth User Error:", err);
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};
