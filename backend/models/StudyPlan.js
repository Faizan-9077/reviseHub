const mongoose = require('mongoose');

const StudyPlanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    topics: [
        {
            title: { type: String, required: true },
            status: { type: String, enum: ['pending','completed'], default: 'pending' },
            deadline: { type: Date }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('StudyPlan', StudyPlanSchema);
