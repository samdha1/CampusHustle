const router = require("express").Router();
const { body } = require("express-validator");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const wrap = require("../utils/asyncWrap");
const { CATEGORIES, CONDITIONS } = require("../models/Listing");
const c = require("../controllers/listingController");

const rules = [
  body("title").trim().isLength({ min: 2, max: 80 }).withMessage("Title must be 2-80 characters."),
  body("description").trim().isLength({ min: 5, max: 1000 }).withMessage("Description must be 5-1000 characters."),
  body("price").isFloat({ min: 0, max: 10000000 }).withMessage("Enter a valid price (0 or more).").toFloat(),
  body("category").isIn(CATEGORIES).withMessage("Choose a valid category."),
  body("condition").isIn(CONDITIONS).withMessage("Choose a valid condition."),
];

// Browsing requires login (campus-only marketplace)
router.get("/", protect, wrap(c.getAll));
router.get("/mine", protect, wrap(c.getMine)); // must come before "/:id"
router.get("/:id", protect, wrap(c.getOne));

// Multer must run before validation so multipart text fields are parsed
router.post("/", protect, upload, rules, wrap(c.create));
router.put("/:id", protect, upload, rules, wrap(c.update));
router.delete("/:id", protect, wrap(c.remove));

module.exports = router;
