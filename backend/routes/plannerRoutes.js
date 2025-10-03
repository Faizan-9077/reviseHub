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
            topics: topics.map(t => ({
                name: t.name || t,
                status: t.status || 'pending',
                dueDate: t.dueDate || null
            }))
        });
        await plan.save();
        res.status(201).json(plan);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Get all study plans for logged-in user
router.get('/', async (req, res) => {
    try {
        const plans = await StudyPlan.find({ userId: req.user._id });
        res.json(plans);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Update topic status, name, or dueDate
router.put('/:planId/topics/:topicId', async (req, res) => {
    try {
        const { status, dueDate, name } = req.body;
        const plan = await StudyPlan.findOne({ _id: req.params.planId, userId: req.user._id });
        if (!plan) return res.status(404).json({ message: 'Study plan not found' });

        const topic = plan.topics.id(req.params.topicId);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        if (status !== undefined) topic.status = status;
        if (dueDate !== undefined) topic.dueDate = dueDate;
        if (name !== undefined) topic.name = name;

        await plan.save();
        res.json(plan);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Reorder topics within a plan
router.put('/:planId/reorder', async (req, res) => {
    try {
        const { topics } = req.body; // full reordered array of topics
        const plan = await StudyPlan.findOne({ _id: req.params.planId, userId: req.user._id });
        if (!plan) return res.status(404).json({ message: 'Study plan not found' });

        plan.topics = topics.map(t => ({
            _id: t._id,
            name: t.name,
            status: t.status || 'pending',
            dueDate: t.dueDate || null
        }));

        await plan.save();
        res.json(plan);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
