const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    filePath: { type: String, required: true },

    // New fields
    category: { type: String, default: '' },      // Subject/Exam
    favorite: { type: Boolean, default: false },  // Favorite/bookmark
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
