const router = require("express").Router();
const { body } = require("express-validator");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const wrap = require("../utils/asyncWrap");
const c = require("../controllers/profileController");

router.use(protect);

router.put(
	"/",
	upload,
	[
		body("name").trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2-60 characters."),
		body("department").optional().trim().isLength({ max: 60 }).withMessage("Department must be 60 characters or fewer."),
		body("bio").optional().trim().isLength({ max: 200 }).withMessage("Bio must be 200 characters or fewer."),
	],
	wrap(c.update)
);

router.put(
	"/password",
	[
		body("currentPassword").notEmpty().withMessage("Enter your current password."),
		body("newPassword")
			.isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
			.matches(/[A-Za-z]/).withMessage("Password needs at least one letter.")
			.matches(/\d/).withMessage("Password needs at least one number."),
	],
	wrap(c.changePassword)
);

module.exports = router;
