const multer = require('multer');
const path = require('path');

// Destination folder + filename configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Optional: filter allowed file types
const fileFilter = (req, file, cb) => {
  const allowed = /pdf|doc|docx|txt|jpg|jpeg|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error('Unsupported file type'), false);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
