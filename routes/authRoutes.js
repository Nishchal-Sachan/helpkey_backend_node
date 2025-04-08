const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

console.log("signupAdmin type:", typeof authController.signupAdmin); // should log 'function'
console.log("loginAdmin type:", typeof authController.loginAdmin);


router.post("/signup", authController.signupAdmin);
router.post("/login", authController.loginAdmin);
router.post("/logout", authController.logoutAdmin);
router.get("/authuser", authController.getAuthUser);

module.exports = router;
