const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Use on any route that needs a logged-in user (REQ-1, and later REQ-2 / REQ-7).
// Sets req.user on success.
exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Please log in to continue." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Account no longer exists." });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
};
