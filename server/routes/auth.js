const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const { register, login, logout, me } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Slow down brute-force attempts: 20 tries per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Try again in a few minutes." },
});

const emailRule = body("email").isEmail().withMessage("Enter a valid email address.").normalizeEmail();

const registerRules = [
  body("name").trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2-60 characters."),
  emailRule,
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/[A-Za-z]/).withMessage("Password needs at least one letter.")
    .matches(/\d/).withMessage("Password needs at least one number."),
];

const loginRules = [emailRule, body("password").notEmpty().withMessage("Enter your password.")];

router.post("/register", authLimiter, registerRules, register);
router.post("/login", authLimiter, loginRules, login);
router.post("/logout", logout);
router.get("/me", protect, me);

module.exports = router;
