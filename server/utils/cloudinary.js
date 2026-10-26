const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const KINDS = {
  // Listing photos: shrink big photos, serve the best format automatically
  listing: {
    folder: "campus-hustle",
    transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto", fetch_format: "auto" }],
  },
  // Profile pictures: square crop around the face
  avatar: {
    folder: "campus-hustle/avatars",
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }],
  },
};

// Upload an in-memory image (from multer) -> { url, publicId }
exports.uploadImage = (buffer, kind = "listing") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        ...KINDS[kind],
        resource_type: "image",
        allowed_formats: ["jpg", "png", "webp"],
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
