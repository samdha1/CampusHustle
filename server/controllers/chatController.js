const mongoose = require("mongoose");
const Listing = require("../models/Listing");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { signTicket } = require("../utils/wsTicket");

const populateConvo = (q) =>
  q.populate("listing", "title price image").populate("buyer", "name").populate("seller", "name");

const isParticipant = (convo, userId) => convo.buyer.equals(userId) || convo.seller.equals(userId);

// POST /api/chats  { listingId }  -> find or create the conversation with the item's owner
exports.start = async (req, res) => {
  const { listingId } = req.body;
  if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ message: "Invalid listing." });

  const listing = await Listing.findById(listingId);
  if (!listing) return res.status(404).json({ message: "Listing not found." });
  if (listing.owner.equals(req.user._id)) {
    return res.status(400).json({ message: "This is your own listing." });
  }

  // Atomic upsert: double-clicking can't create two conversations
  const convo = await populateConvo(
    Conversation.findOneAndUpdate(
      { listing: listing._id, buyer: req.user._id },
      { $setOnInsert: { seller: listing.owner } },
      { upsert: true, new: true }
    )
  );
  res.json({ conversation: convo });
};

// GET /api/chats  -> my conversations (sellers only see ones that already have messages)
exports.list = async (req, res) => {
  const me = req.user._id;
  const conversations = await populateConvo(
    Conversation.find({ $or: [{ buyer: me }, { seller: me, lastMessage: { $ne: "" } }] }).sort({ lastMessageAt: -1 })
  );
  res.json({ conversations });
};

// GET /api/chats/:id/messages  -> last 200 messages (participants only)
exports.messages = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Conversation not found." });
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !isParticipant(convo, req.user._id)) {
    return res.status(404).json({ message: "Conversation not found." });
  }
  const messages = await Message.find({ conversation: convo._id }).sort({ createdAt: -1 }).limit(200);
  res.json({ messages: messages.reverse() });
};

// GET /api/chats/ws-ticket  -> 60-second ticket for opening the WebSocket
exports.wsTicket = (req, res) => {
  res.json({ ticket: signTicket(req.user._id) });
};
