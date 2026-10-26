const mongoose = require("mongoose");
const User = require("../models/User");

// GET /api/users/:id  -> public profile (never includes the email)
exports.getPublic = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "User not found." });
  const user = await User.findById(req.params.id).select("name department bio avatar createdAt");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({
    user: {
      id: user._id,
      name: user.name,
      department: user.department,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
  });
};