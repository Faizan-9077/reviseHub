const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const StudyPlan = require("../models/StudyPlan");

// Protect all /progress routes
router.use(authMiddleware);

// GET /progress → calculate progress dynamically
router.get("/", async (req, res) => {
  try {
    const plans = await StudyPlan.find({ userId: req.user._id });

    let totalTopics = 0;
    let completedTopics = 0;

    // Loop through all study plans and count topics
    plans.forEach((plan) => {
      totalTopics += plan.topics.length;
      completedTopics += plan.topics.filter((t) => t.status === "completed")
        .length;
    });

    const overallProgress =
      totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

    res.json({ overallProgress, plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
