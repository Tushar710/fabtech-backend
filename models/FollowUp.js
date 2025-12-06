const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'demo', 'proposal', 'message', 'assignment', 'other'],
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  nextStep: {
    type: String
  },
  nextFollowUpDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  addedByName: {
    type: String
  },
  addedByRole: {
    type: String
  },
  addedByEmail: {
    type: String
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  assignedToName: {
    type: String
  },
  assignedToEmail: {
    type: String
  },
  assignedToPhone: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  rescheduleCount: {
    type: Number,
    default: 0
  },
  rescheduleHistory: [{
    previousDate: Date,
    newDate: Date,
    reason: String,
    rescheduledAt: Date,
    rescheduledBy: String
  }],
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  },
  whatsappMessageSent: {
    type: Boolean,
    default: false
  },
  whatsappMessageId: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
followUpSchema.index({ leadId: 1, nextFollowUpDate: 1 });
followUpSchema.index({ assignedTo: 1, completed: 1 });
followUpSchema.index({ nextFollowUpDate: 1, completed: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
