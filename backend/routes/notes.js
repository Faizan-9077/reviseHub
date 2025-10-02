const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // Multer middleware
const Note = require('../models/Note');

// GET /notes → list all notes for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ updatedAt: -1 });

    // Include full URL to access uploaded files
    const notesWithUrl = notes.map((n) => ({
      ...n.toObject(),
      fileUrl: `${req.protocol}://${req.get('host')}/uploads/${n.filePath}`,
    }));

    res.json(notesWithUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

// POST /notes → create a new note with file upload
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ message: 'Title and file are required' });
    }

    const note = new Note({
      userId: req.user._id,
      title,
      description: description || '',
      filePath: req.file.filename,
    });

    await note.save();

    res.status(201).json({
      ...note.toObject(),
      fileUrl: `${req.protocol}://${req.get('host')}/uploads/${note.filePath}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create note' });
  }
});

// PUT /notes/:id → update note metadata (title + description)
// Optional: file re-upload can be handled later if needed
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (title !== undefined) note.title = title;
    if (description !== undefined) note.description = description;

    await note.save();

    res.json({
      ...note.toObject(),
      fileUrl: `${req.protocol}://${req.get('host')}/uploads/${note.filePath}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update note' });
  }
});

// DELETE /notes/:id → delete a note
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

module.exports = router;
