const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/signup", authController.signupAdmin);
router.post("/login", authController.loginAdmin);
router.post("/logout", authController.logoutAdmin);
router.get("/authuser", authController.getAuthAdmin); // Admin auth check route


module.exports = router;
