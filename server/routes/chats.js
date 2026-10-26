const router = require("express").Router();
const { protect } = require("../middleware/auth");
const wrap = require("../utils/asyncWrap");
const c = require("../controllers/chatController");

router.use(protect);
router.get("/ws-ticket", wrap(c.wsTicket));
router.get("/unread", wrap(c.unreadCount));
router.post("/", wrap(c.start));
router.get("/", wrap(c.list));
router.post("/:id/read", wrap(c.markRead));
router.delete("/:id", wrap(c.remove));
router.get("/:id/messages", wrap(c.messages));

module.exports = router;