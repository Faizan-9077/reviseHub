const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const StudyPlan = require('../models/StudyPlan');

// Protect all /planner routes
router.use(authMiddleware);

// Create a new study plan
router.post('/create', async (req, res) => {
    try {
        const { subject, topics } = req.body;
        const plan = new StudyPlan({
            userId: req.user._id,
            subject,
            topics
        });
        await plan.save();
        res.status(201).json(plan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all study plans for logged-in user
router.get('/', async (req, res) => {
    try {
        const plans = await StudyPlan.find({ userId: req.user._id });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update topic status
router.put('/:planId/topics/:topicId', async (req, res) => {
    try {
        const { status } = req.body; // 'pending' or 'completed'
        const plan = await StudyPlan.findOne({ _id: req.params.planId, userId: req.user._id });
        if (!plan) return res.status(404).json({ message: 'Study plan not found' });

        const topic = plan.topics.id(req.params.topicId);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        topic.status = status;
        await plan.save();
        res.json(plan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
