const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Listing = require("../models/Listing");
const Message = require("../models/Message");
const { signTicket } = require("../utils/wsTicket");

const isParticipant = (conversation, userId) =>
  conversation.buyer.equals(userId) || conversation.seller.equals(userId);

const unreadField = (conversation, userId) =>
  conversation.buyer.equals(userId) ? "unreadBuyer" : "unreadSeller";

const hiddenField = (conversation, userId) =>
  conversation.buyer.equals(userId) ? "hiddenBuyer" : "hiddenSeller";

const clearedField = (conversation, userId) =>
  conversation.buyer.equals(userId) ? "clearedBuyerAt" : "clearedSellerAt";

const findParticipantConversation = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) return null;
  const conversation = await Conversation.findById(id);
  return conversation && isParticipant(conversation, userId) ? conversation : null;
};

exports.wsTicket = (req, res) => {
  res.json({ ticket: signTicket(req.user._id) });
};

exports.unreadCount = async (req, res) => {
  const conversations = await Conversation.find({
    $or: [{ buyer: req.user._id }, { seller: req.user._id }],
  }).select("buyer seller unreadBuyer unreadSeller hiddenBuyer hiddenSeller");

  const count = conversations.reduce((total, conversation) => {
    if (conversation[hiddenField(conversation, req.user._id)]) return total;
    return total + conversation[unreadField(conversation, req.user._id)];
  }, 0);

  res.json({ count });
};

exports.start = async (req, res) => {
  const { listingId } = req.body;
  if (!mongoose.isValidObjectId(listingId)) {
    return res.status(400).json({ message: "Listing not found." });
  }

  const listing = await Listing.findById(listingId).select("owner");
  if (!listing) return res.status(404).json({ message: "Listing not found." });
  if (listing.owner.equals(req.user._id)) {
    return res.status(400).json({ message: "You cannot message yourself about your own listing." });
  }

  let conversation = await Conversation.findOne({ listing: listing._id, buyer: req.user._id });
  if (!conversation) {
    try {
      conversation = await Conversation.create({
        listing: listing._id,
        buyer: req.user._id,
        seller: listing.owner,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      conversation = await Conversation.findOne({ listing: listing._id, buyer: req.user._id });
      if (!conversation) throw error;
    }
  }

  const hiddenForUser = hiddenField(conversation, req.user._id);
  if (conversation[hiddenForUser]) {
    await Conversation.updateOne({ _id: conversation._id }, { $set: { [hiddenForUser]: false } });
    conversation[hiddenForUser] = false;
  }

  res.status(200).json({ conversation });
};

exports.list = async (req, res) => {
  const conversations = await Conversation.find({
    $or: [{ buyer: req.user._id }, { seller: req.user._id }],
  })
    .sort({ lastMessageAt: -1 })
    .populate("listing", "title price image")
    .populate("buyer", "name department avatar")
    .populate("seller", "name department avatar");

  const visible = conversations
    .filter((conversation) => !conversation[hiddenField(conversation, req.user._id)])
    .map((conversation) => ({
      ...conversation.toObject(),
      unread: conversation[unreadField(conversation, req.user._id)],
    }));

  res.json({ conversations: visible });
};

exports.markRead = async (req, res) => {
  const conversation = await findParticipantConversation(req.params.id, req.user._id);
  if (!conversation) return res.status(404).json({ message: "Conversation not found." });

  await Conversation.updateOne(
    { _id: conversation._id },
    { $set: { [unreadField(conversation, req.user._id)]: 0 } }
  );
  res.json({ message: "Conversation marked as read." });
};

exports.remove = async (req, res) => {
  const conversation = await findParticipantConversation(req.params.id, req.user._id);
  if (!conversation) return res.status(404).json({ message: "Conversation not found." });

  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: {
        [hiddenField(conversation, req.user._id)]: true,
        [clearedField(conversation, req.user._id)]: new Date(),
        [unreadField(conversation, req.user._id)]: 0,
      },
    }
  );
  res.json({ message: "Conversation deleted." });
};

exports.messages = async (req, res) => {
  const conversation = await findParticipantConversation(req.params.id, req.user._id);
  if (!conversation) return res.status(404).json({ message: "Conversation not found." });

  const clearedAt = conversation[clearedField(conversation, req.user._id)];
  const filter = { conversation: conversation._id };
  if (clearedAt) filter.createdAt = { $gt: clearedAt };

  const messages = await Message.find(filter).sort({ createdAt: 1 }).limit(500);
  res.json({ messages });
};
