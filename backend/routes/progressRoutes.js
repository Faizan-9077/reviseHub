const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const StudyPlan = require('../models/StudyPlan');

router.use(authMiddleware);

// GET progress: % completed per subject
router.get('/', async (req, res) => {
    try {
        const plans = await StudyPlan.find({ userId: req.user._id });

        const progress = plans.map(plan => {
            const total = plan.topics.length;
            const completed = plan.topics.filter(t => t.status === 'completed').length;
            const percentCompleted = total === 0 ? 0 : Math.round((completed / total) * 100);
            return {
                subject: plan.subject,
                totalTopics: total,
                completedTopics: completed,
                percentCompleted
            };
        });

        res.json(progress);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
