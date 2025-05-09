const jwt = require("jsonwebtoken");
const verifyClient = (req, res, next) => {
    const token = req.cookies.token;
  
    if (!token) {
      return res.status(401).json({ success: false, error: "Access Denied. No token provided." });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.client = decoded; // 🔥 This must be set for client
      next();
    } catch (err) {
      console.error("Token Verification Error:", err);
      return res.status(403).json({ success: false, error: "Invalid token" });
    }
  };
  
  module.exports = verifyClient;
  