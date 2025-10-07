const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'revisehub_uploads', // your custom folder name in Cloudinary
    resource_type: 'auto', // auto-detects file type (image, pdf, etc.)
  },
});

// Export Multer instance
const upload = multer({ storage });

module.exports = { upload, cloudinary };
