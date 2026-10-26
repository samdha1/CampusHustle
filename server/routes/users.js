const router = require("express").Router();
const { protect } = require("../middleware/auth");
const wrap = require("../utils/asyncWrap");
const c = require("../controllers/userController");

router.get("/:id", protect, wrap(c.getPublic));

module.exports = router;