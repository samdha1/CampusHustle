const mongoose = require("mongoose");

// One conversation per (listing, interested buyer). The seller is the listing owner.
const conversationSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    // unread message counts for each side (reset when that person opens the chat)
    unreadBuyer: { type: Number, default: 0 },
    unreadSeller: { type: Number, default: 0 },
    // "Delete chat" is per person: it hides the chat and clears that person's history up to this moment.
    // The other person keeps their copy. A new message un-hides the chat for both (showing only new messages).
    hiddenBuyer: { type: Boolean, default: false },
    hiddenSeller: { type: Boolean, default: false },
    clearedBuyerAt: { type: Date, default: null },
    clearedSellerAt: { type: Date, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ listing: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);