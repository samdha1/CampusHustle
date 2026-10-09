const router = require("express").Router();
const { protect } = require("../middleware/auth");
const wrap = require("../utils/asyncWrap");
const c = require("../controllers/chatController");

router.use(protect);
router.get("/ws-ticket", wrap(c.wsTicket));
router.post("/", wrap(c.start));
router.get("/", wrap(c.list));
router.get("/:id/messages", wrap(c.messages));

module.exports = router;
