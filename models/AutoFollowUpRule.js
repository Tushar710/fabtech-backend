const mongoose = require('mongoose');

const autoFollowUpRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  triggerCondition: {
    leadStatus: [String], // ['new', 'contacted', 'qualified']
    leadSource: [String], // ['website', 'instagram', 'facebook']
    daysSinceCreated: Number, // Days after lead creation
    daysSinceLastContact: Number, // Days after last contact
    leadValue: {
      min: Number,
      max: Number
    }
  },
  messageTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate',
    required: true
  },
  scheduleDelay: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days'],
      default: 'hours'
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  maxExecutions: {
    type: Number,
    default: 1 // How many times this rule can execute for same lead
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

autoFollowUpRuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AutoFollowUpRule', autoFollowUpRuleSchema);
