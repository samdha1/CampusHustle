const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Listing = require("../models/Listing");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

const { CATEGORIES, CONDITIONS } = Listing;

const validationMessage = (req) => {
  const errors = validationResult(req);
  return errors.isEmpty() ? null : errors.array()[0].msg;
};

// Only public seller info is exposed to other users (never the email)
const withOwner = (query) => query.populate("owner", "name department avatar");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 },
};

const UPLOAD_FAILED = { message: "Image upload failed. Please try again." };

// GET /api/listings?q=&category=&condition=&minPrice=&maxPrice=&sort=   (REQ-4: browse, search, filter)
exports.getAll = async (req, res) => {
  const { q, category, condition, minPrice, maxPrice, sort, owner } = req.query;
  const filter = {};

  if (typeof q === "string" && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim().slice(0, 50)), "i"); // escaped: user text is never a regex
    filter.$or = [{ title: rx }, { description: rx }];
  }
  if (CATEGORIES.includes(category)) filter.category = category;
  if (CONDITIONS.includes(condition)) filter.condition = condition;
  if (typeof owner === "string" && mongoose.isValidObjectId(owner)) filter.owner = owner; // a seller's public profile

  const price = {};
  if (minPrice !== undefined && minPrice !== "" && Number.isFinite(Number(minPrice))) price.$gte = Number(minPrice);
  if (maxPrice !== undefined && maxPrice !== "" && Number.isFinite(Number(maxPrice))) price.$lte = Number(maxPrice);
  if (Object.keys(price).length) filter.price = price;

  const listings = await withOwner(Listing.find(filter).sort(SORTS[sort] || SORTS.newest).limit(100));
  res.json({ listings });
};

// GET /api/listings/mine   (REQ-6: manage personal listings)
exports.getMine = async (req, res) => {
  const listings = await withOwner(Listing.find({ owner: req.user._id }).sort({ createdAt: -1 }));
  res.json({ listings });
};

// GET /api/listings/:id   (REQ-5: item details + owner)
exports.getOne = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Listing not found." });
  const listing = await withOwner(Listing.findById(req.params.id));
  if (!listing) return res.status(404).json({ message: "Listing not found." });
  res.json({ listing });
};

// POST /api/listings
exports.create = async (req, res) => {
  const msg = validationMessage(req);
  if (msg) return res.status(400).json({ message: msg });

  // Upload only after the text fields are valid, so bad requests never create orphan images
  let img = { url: "", publicId: "" };
  if (req.file) {
    try {
      img = await uploadImage(req.file.buffer);
    } catch (e) {
      console.error("Cloudinary upload failed:", e.message);
      return res.status(502).json(UPLOAD_FAILED);
    }
  }

  const { title, description, price, category, condition } = req.body;
  try {
    const listing = await Listing.create({
      title, description, price, category, condition,
      image: img.url,
      imagePublicId: img.publicId,
      owner: req.user._id,
    });
    res.status(201).json({ listing });
  } catch (e) {
    await deleteImage(img.publicId); // don't leave an orphan image behind
    throw e;
  }
};

// PUT /api/listings/:id   (owner only: REQ-7)
exports.update = async (req, res) => {
  const msg = validationMessage(req);
  if (msg) return res.status(400).json({ message: msg });

  const listing = mongoose.isValidObjectId(req.params.id) ? await Listing.findById(req.params.id) : null;
  if (!listing) return res.status(404).json({ message: "Listing not found." });
  if (!listing.owner.equals(req.user._id)) {
    return res.status(403).json({ message: "You can only edit your own listings." });
  }

  let uploaded = null;
  if (req.file) {
    try {
      uploaded = await uploadImage(req.file.buffer);
    } catch (e) {
      console.error("Cloudinary upload failed:", e.message);
      return res.status(502).json(UPLOAD_FAILED);
    }
  }

  const { title, description, price, category, condition, removeImage } = req.body;
  const oldPublicId = listing.imagePublicId;
  const replacing = Boolean(uploaded) || removeImage === "true";

  Object.assign(listing, { title, description, price, category, condition });
  if (uploaded) {
    listing.image = uploaded.url;
    listing.imagePublicId = uploaded.publicId;
  } else if (removeImage === "true") {
    listing.image = "";
    listing.imagePublicId = "";
  }

  try {
    await listing.save();
  } catch (e) {
    if (uploaded) await deleteImage(uploaded.publicId);
    throw e;
  }

  if (replacing) await deleteImage(oldPublicId); // remove the old image only after the save succeeded
  res.json({ listing });
};

// DELETE /api/listings/:id   (owner only: REQ-7)
exports.remove = async (req, res) => {
  const listing = mongoose.isValidObjectId(req.params.id) ? await Listing.findById(req.params.id) : null;
  if (!listing) return res.status(404).json({ message: "Listing not found." });
  if (!listing.owner.equals(req.user._id)) {
    return res.status(403).json({ message: "You can only delete your own listings." });
  }

  // Remove chats about this item too, so nobody is left with a conversation about a missing listing
  const convos = await Conversation.find({ listing: listing._id }).select("_id");
  const ids = convos.map((c) => c._id);
  await Message.deleteMany({ conversation: { $in: ids } });
  await Conversation.deleteMany({ _id: { $in: ids } });

  await listing.deleteOne();
  await deleteImage(listing.imagePublicId);
  res.json({ message: "Listing deleted." });
};