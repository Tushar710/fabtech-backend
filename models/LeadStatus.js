const mongoose = require('mongoose');

const leadStatusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    enum: ['blue', 'yellow', 'green', 'emerald', 'purple', 'orange', 'red', 'amber', 'indigo', 'gray', 'slate'],
    default: 'blue'
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  // Status flow configuration
  canTransitionTo: [{
    type: String, // References to other status names
    trim: true
  }],
  // Automation settings
  autoActions: {
    sendEmail: {
      enabled: { type: Boolean, default: false },
      templateId: String,
      delay: { type: Number, default: 0 } // in minutes
    },
    sendWhatsApp: {
      enabled: { type: Boolean, default: false },
      message: String,
      delay: { type: Number, default: 0 } // in minutes
    },
    assignTo: {
      enabled: { type: Boolean, default: false },
      employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
    },
    createFollowUp: {
      enabled: { type: Boolean, default: false },
      days: { type: Number, default: 1 },
      message: String
    }
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

// Create compound index for company-specific unique status names
leadStatusSchema.index({ name: 1, companyId: 1 }, { unique: true });
leadStatusSchema.index({ companyId: 1, order: 1 });
leadStatusSchema.index({ companyId: 1, isActive: 1 });

leadStatusSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});


module.exports = mongoose.model('LeadStatus', leadStatusSchema);
