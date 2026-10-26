const { validationResult } = require("express-validator");
const User = require("../models/User");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

const firstError = (req) => {
  const errors = validationResult(req);
  return errors.isEmpty() ? null : errors.array()[0].msg;
};

// PUT /api/profile   (multipart: name, department, bio, optional image, optional removeAvatar=true)
// The email is intentionally not editable: it is what proves the person belongs to the campus.
exports.update = async (req, res) => {
  const msg = firstError(req);
  if (msg) return res.status(400).json({ message: msg });

  let uploaded = null;
  if (req.file) {
    try {
      uploaded = await uploadImage(req.file.buffer, "avatar");
    } catch (e) {
      console.error("Cloudinary upload failed:", e.message);
      return res.status(502).json({ message: "Image upload failed. Please try again." });
    }
  }

  const { name, department = "", bio = "", removeAvatar } = req.body;
  const oldPublicId = req.user.avatarPublicId;
  const changes = { name, department, bio };

  if (uploaded) {
    changes.avatar = uploaded.url;
    changes.avatarPublicId = uploaded.publicId;
  } else if (removeAvatar === "true") {
    changes.avatar = "";
    changes.avatarPublicId = "";
  }

  let user;
  try {
    user = await User.findByIdAndUpdate(req.user._id, { $set: changes }, { new: true, runValidators: true });
  } catch (e) {
    if (uploaded) await deleteImage(uploaded.publicId);
    throw e;
  }

  if (uploaded || removeAvatar === "true") await deleteImage(oldPublicId);
  res.json({ user: user.toSafeObject() });
};

// PUT /api/profile/password   { currentPassword, newPassword }
exports.changePassword = async (req, res) => {
  const msg = firstError(req);
  if (msg) return res.status(400).json({ message: msg });

  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.matchPassword(currentPassword))) {
    return res.status(400).json({ message: "Current password is incorrect." });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ message: "New password must be different from the current one." });
  }

  user.password = newPassword; // hashed by the model's pre-save hook
  await user.save();
  res.json({ message: "Password updated." });
};
