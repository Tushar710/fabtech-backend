const mongoose = require('mongoose');

// Auto-increment plugin for serial numbers
let AutoIncrement;
try {
  AutoIncrement = require('mongoose-sequence')(mongoose);
} catch (error) {
  console.log('mongoose-sequence not available, using manual counter');
  AutoIncrement = null;
}

const leadSchema = new mongoose.Schema({
  // Serial Number (auto-generated)
  serialNumber: {
    type: Number
  },
  
  // Date (auto-generated)
  date: {
    type: Date,
    default: Date.now
  },
  
  // Customer Information
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: false, // Make optional to avoid conflicts
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  customerCompany: {
    type: String,
    trim: true
  },
  
  // Product & Business Information (flexible - accepts any value)
  productOfInterest: {
    type: String,
    default: 'Other'
  },
  sector: {
    type: String,
    default: 'Other'
  },
  sourceOfLead: {
    type: String,
    default: 'Website'
  },
  productCategory: {
    type: String,
    default: 'Software'
  },
  
  // Lead Management
  status: {
    type: String,
    default: 'new'
  },
  statusReason: {
    type: String,
    trim: true
  },
  statusUpdatedAt: {
    type: Date
  },
  priority: {
    type: String,
    default: 'medium'
  },
  value: {
    type: Number,
    default: 0
  },
  budget: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Auto-capture specific fields
  autoCaptured: {
    type: Boolean,
    default: false
  },
  captureSource: {
    platform: String,
    campaign: String,
    formData: mongoose.Schema.Types.Mixed,
    pageUrl: String,
    userAgent: String,
    ipAddress: String,
    timestamp: Date
  },
  
  // Assignment and Management
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  assignmentNotes: {
    type: String
  },
  // Assigned employee details for quick access
  assignedEmployeeName: {
    type: String
  },
  assignedEmployeePhone: {
    type: String
  },
  assignedEmployeeEmail: {
    type: String
  },
  // Branch assignment
  assignedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  assignedBranchName: {
    type: String
  },
  // Department assignment (optional)
  assignedDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  assignedDepartmentName: {
    type: String
  },
  // Employee assignment
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  // Lead creator tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel'
  },
  createdByModel: {
    type: String,
    enum: ['Employee', 'User', 'Company', 'Department'],
    default: 'User'
  },
  createdByName: {
    type: String
  },
  createdByBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  createdByDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // Company reference for multi-company system
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false, // Made optional to fix validation error
    index: true
  },
  
  // Legacy company ID for backward compatibility
  companyId: {
    type: String,
    required: false,
    index: true
  },
  
  // Quotation tracking
  lastQuotationDate: {
    type: Date
  },
  quotationCount: {
    type: Number,
    default: 0
  },
  
  // Follow-ups and Communication
  followUps: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'demo', 'proposal', 'message', 'assignment', 'other'],
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    notes: String,
    date: {
      type: Date,
      default: Date.now
    },
    nextStep: String,
    nextFollowUpDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    // Track who added this follow-up
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'followUps.addedByModel',
      required: false
    },
    addedByModel: {
      type: String,
      enum: ['Employee', 'User', 'Superadmin']
    },
    addedByName: String,
    addedByRole: String,
    addedByEmail: String,
    // Priority level
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending'
    },
    completedAt: Date,
    outcome: String,
    // Reschedule tracking
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
    }]
  }],
  
  // Next Follow-up Date (for dashboard queries)
  nextFollowUp: {
    type: Date
  },
  
  // Custom Fields for dynamic form data
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Additional Information
  notes: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Social Media Profiles
  socialProfiles: {
    instagram: { type: String, trim: true },
    facebook: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    website: { type: String, trim: true }
  },
  
  // Company reference for multi-company system
  companyId: {
    type: String,
    required: false,
    index: true
  },
  
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // Timestamps
  lastContact: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This will add createdAt and updatedAt automatically
});

// Add auto-increment plugin for serial numbers
if (AutoIncrement) {
  leadSchema.plugin(AutoIncrement, { inc_field: 'serialNumber' });
} else {
  // Manual serial number generation if plugin not available
  leadSchema.pre('save', async function(next) {
    if (!this.serialNumber) {
      const lastLead = await this.constructor.findOne({}, {}, { sort: { 'serialNumber': -1 } });
      this.serialNumber = lastLead ? lastLead.serialNumber + 1 : 1;
    }
    next();
  });
}

// Index for better query performance
leadSchema.index({ serialNumber: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ companyId: 1 });
leadSchema.index({ companyId: 1, status: 1 });
leadSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
