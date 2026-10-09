const multer = require("multer");

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// Files are kept in memory only and streamed to Cloudinary (nothing is written to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new Error("Image must be a JPG, PNG or WebP file.")),
}).single("image");

// Wrapper so upload errors become clean 400 responses
module.exports = (req, res, next) =>
  upload(req, res, (err) => {
    if (!err) return next();
    const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be 2 MB or smaller." : err.message;
    res.status(400).json({ message });
  });
