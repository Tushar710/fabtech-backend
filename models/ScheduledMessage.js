const mongoose = require('mongoose');

const scheduledMessageSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutoFollowUpRule'
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate'
  },
  phoneNumber: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  lastAttemptAt: Date,
  sentAt: Date,
  failureReason: String,
  messageType: {
    type: String,
    enum: ['auto_follow_up', 'manual', 'reminder'],
    default: 'auto_follow_up'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

scheduledMessageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying of pending messages
scheduledMessageSchema.index({ status: 1, scheduledFor: 1 });
scheduledMessageSchema.index({ leadId: 1, status: 1 });

module.exports = mongoose.model('ScheduledMessage', scheduledMessageSchema);
