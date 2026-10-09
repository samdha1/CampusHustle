const mongoose = require("mongoose");

// One conversation per (listing, interested buyer). The seller is the listing owner.
const conversationSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ listing: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
