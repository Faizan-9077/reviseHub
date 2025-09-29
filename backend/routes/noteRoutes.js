const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Note = require('../models/Note');

// Protect all /notes routes
router.use(authMiddleware);

// Create a note
router.post('/', async (req, res) => {
    try {
        const { title, subject, description, fileUrl } = req.body;
        const note = new Note({
            title,
            subject,
            description,
            fileUrl,
            uploadedBy: req.user._id
        });
        await note.save();
        res.status(201).json(note);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all notes for logged-in user
router.get('/', async (req, res) => {
    try {
        const notes = await Note.find({ uploadedBy: req.user._id });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a note
router.delete('/:id', async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, uploadedBy: req.user._id });
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
