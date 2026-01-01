const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  reminderDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  notified: {
    type: Boolean,
    default: false
  },
  notifiedAt: Date,
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel'
  },
  createdByModel: {
    type: String,
    enum: ['User', 'Employee']
  },
  createdByName: String
}, {
  timestamps: true
});

// Index for faster queries
reminderSchema.index({ companyId: 1, createdBy: 1 });
reminderSchema.index({ reminderDate: 1, completed: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
