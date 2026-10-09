const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

const cookieOptions = () => ({
  httpOnly: true, // JS in the browser cannot read the token (protects against XSS theft)
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const issueToken = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  res.cookie("token", token, cookieOptions());
};

const firstError = (req) => {
  const errors = validationResult(req);
  return errors.isEmpty() ? null : errors.array()[0].msg;
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const err = firstError(req);
  if (err) return res.status(400).json({ message: err });

  try {
    const { name, email, password } = req.body;

    const domain = (process.env.ALLOWED_EMAIL_DOMAIN || "").trim().toLowerCase();
    if (domain && !email.toLowerCase().endsWith("@" + domain)) {
      return res.status(400).json({ message: `Use your campus email (@${domain}).` });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({ name, email, password });
    issueToken(res, user);
    res.status(201).json({ user: user.toSafeObject() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const err = firstError(req);
  if (err) return res.status(400).json({ message: err });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    // Same message for unknown email and wrong password, so accounts can't be probed.
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    issueToken(res, user);
    res.json({ user: user.toSafeObject() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie("token", opts);
  res.json({ message: "Logged out." });
};

// GET /api/auth/me
exports.me = (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};
