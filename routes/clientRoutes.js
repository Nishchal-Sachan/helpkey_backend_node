const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

console.log("✅ clientRoutes.js loaded");


router.post("/signup", authController.signupClient);//client signup
router.post("/login", authController.loginClient); // Client login
router.post("/logout", authController.logoutClient); // Client logout
router.get("/authuser", authController.getAuthClient); // Client auth check route

module.exports = router;
