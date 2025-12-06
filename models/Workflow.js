const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  stages: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    order: {
      type: Number,
      required: true
    },
    color: {
      type: String,
      default: '#3B82F6'
    },
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
workflowSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Workflow', workflowSchema);
