const express = require("express");
const multer = require("multer");
const path = require("path");
const Note = require("../models/Note");

const router = express.Router();

// configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // save files in backend/uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// POST /api/notes/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const newNote = new Note({
      title: req.body.title,
      filePath: req.file.path,
    });

    await newNote.save();

    res.json({ message: "✅ Note uploaded successfully", note: newNote });
  } catch (err) {
    res.status(500).json({ error: "❌ Failed to upload note" });
  }
});

module.exports = router;
