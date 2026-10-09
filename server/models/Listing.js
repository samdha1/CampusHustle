const mongoose = require("mongoose");

const CATEGORIES = ["Books", "Electronics", "Furniture", "Clothing", "Stationery", "Other"];
const CONDITIONS = ["New", "Like new", "Good", "Fair"];

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: CATEGORIES, default: "Other" },
    condition: { type: String, enum: CONDITIONS, default: "Good" },
    image: { type: String, default: "" }, // Cloudinary https URL
    imagePublicId: { type: String, default: "" }, // Cloudinary id, needed to delete the image later
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.CONDITIONS = CONDITIONS;
