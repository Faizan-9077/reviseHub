const mongoose = require('mongoose');

// Each topic in a study plan
const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  dueDate: { type: Date, default: null },
});

// Study plan schema
const studyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    topics: [topicSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
