const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

console.log("✅ clientRoutes.js loaded");


router.post("/signup", (req, res, next) => {
    console.log("🚀 Client signup route hit");
    next(); // Call the actual controller
  }, authController.signupClient);
   // Assuming you have a signup route for clients
router.post("/login", authController.loginClient); // Client login
router.post("/logout", authController.logoutClient); // Client logout
router.get("/authuser", authController.getAuthClient); // Client auth check route

module.exports = router;
