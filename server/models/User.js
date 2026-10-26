const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select:false -> password hash is never returned unless explicitly requested
    password: { type: String, required: true, minlength: 8, select: false },
    department: { type: String, trim: true, maxlength: 60, default: "" },
    bio: { type: String, trim: true, maxlength: 200, default: "" },
    avatar: { type: String, default: "" }, // Cloudinary https URL
    avatarPublicId: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    department: this.department,
    bio: this.bio,
    avatar: this.avatar,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
