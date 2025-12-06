const mongoose = require('mongoose');

const messageTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: false
  },
  description: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  variables: [String], // Variables like leadName, companyName, etc.
  category: {
    type: String,
    enum: ['welcome', 'assignment', 'reminder', 'missed-call', 'follow-up', 'promotion', 'notification'],
    default: 'follow-up'
  },
  isActive: {
    type: Boolean,
    default: true
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

messageTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);
