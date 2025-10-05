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
    const includeDeleted = String(req.query.includeDeleted || 'false') === 'true';
    const filter = { userId: req.user._id };
    if (!includeDeleted) {
      filter.isDeleted = { $ne: true };
    }
    const notes = await Note.find(filter).sort({ updatedAt: -1 });

    const notesWithUrl = notes.map((n) => ({
      ...n.toObject(),
      fileUrl: n.filePath ? getFileUrl(req, n.filePath) : null,
    }));

    res.json(notesWithUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

// GET /notes/stats → counts including deleted notes (by creation time)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);

    const [thisMonthCount, prevMonthCount] = await Promise.all([
      Note.countDocuments({ userId: req.user._id, createdAt: { $gte: monthStart, $lt: now } }),
      Note.countDocuments({ userId: req.user._id, createdAt: { $gte: prevMonthStart, $lt: monthStart } })
    ]);

    res.json({ thisMonth: thisMonthCount, prevMonth: prevMonthCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch note stats' });
  }
});

// GET /notes/stats/weekly → last 4 weeks counts by creation date (includes deleted)
router.get('/stats/weekly', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const ranges = [0, 1, 2, 3].map(i => {
      const end = new Date(now.getTime() - i * weekMs);
      const start = new Date(end.getTime() - weekMs);
      return { start, end };
    });

    const counts = await Promise.all(
      ranges.map(r => Note.countDocuments({ userId: req.user._id, createdAt: { $gte: r.start, $lt: r.end } }))
    );

    // Return newest to oldest: index 0 is current week, 1 is last week, etc.
    res.json({ weeks: counts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch weekly note stats' });
  }
});

// POST /notes → create a new note with file upload + category
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ message: 'Title and file are required' });
    }

    const note = new Note({
      userId: req.user._id,
      title,
      description: description || '',
      filePath: req.file.filename,
      category: category || '',
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

// PUT /notes/:id → update note metadata (title, description, category, favorite)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, favorite } = req.body;
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (title !== undefined) note.title = title;
    if (description !== undefined) note.description = description;
    if (category !== undefined) note.category = category;
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
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: { $ne: true } });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const filePath = path.join(__dirname, '../uploads', note.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Soft delete instead of permanent deletion to preserve monthly stats
    note.isDeleted = true;
    await note.save();
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

module.exports = router;
