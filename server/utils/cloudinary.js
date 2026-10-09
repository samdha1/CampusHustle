const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload an in-memory image (from multer) -> { url, publicId }
exports.uploadImage = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "campus-hustle",
        resource_type: "image",
        allowed_formats: ["jpg", "png", "webp"],
        // Shrink big photos and serve the best format automatically
        transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto", fetch_format: "auto" }],
      },
      (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id }))
    );
    stream.end(buffer);
  });

// Never throws: a failed cleanup shouldn't break the request
exports.deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.error("Cloudinary delete failed:", e.message);
  }
};
