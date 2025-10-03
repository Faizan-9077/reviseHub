const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // Multer middleware
const Note = require('../models/Note');
const fs = require('fs');
const path = require('path');

// Helper to build full file URL
const getFileUrl = (req, filePath) => `${req.protocol}://${req.get('host')}/uploads/${filePath}`;

// GET /notes → list all notes for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ updatedAt: -1 });

    const notesWithUrl = notes.map((n) => ({
      ...n.toObject(),
      fileUrl: getFileUrl(req, n.filePath),
    }));

    res.json(notesWithUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

// POST /notes → create a new note with file upload + category + tags
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ message: 'Title and file are required' });
    }

    const note = new Note({
      userId: req.user._id,
      title,
      description: description || '',
      filePath: req.file.filename,
      category: category || '',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      favorite: false,
    });

    await note.save();

    res.status(201).json({
      ...note.toObject(),
      fileUrl: getFileUrl(req, note.filePath),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create note' });
  }
});

// PUT /notes/:id → update note metadata (title, description, category, tags, favorite)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, tags, favorite } = req.body;
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (title !== undefined) note.title = title;
    if (description !== undefined) note.description = description;
    if (category !== undefined) note.category = category;
    if (tags !== undefined) note.tags = tags.split(',').map(t => t.trim());
    if (favorite !== undefined) note.favorite = favorite;

    await note.save();

    res.json({
      ...note.toObject(),
      fileUrl: getFileUrl(req, note.filePath),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update note' });
  }
});

// DELETE /notes/:id → delete a note + remove file from disk
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const filePath = path.join(__dirname, '../uploads', note.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await note.remove();
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

module.exports = router;
