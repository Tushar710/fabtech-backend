const mongoose = require('mongoose');

// Schema for FABTECH company departments
const departmentSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  departmentHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  // Access Permissions for Department
  permissions: {
    canAddLead: {
      type: Boolean,
      default: true
    },
    canViewAllLeads: {
      type: Boolean,
      default: false // Only see assigned leads by default
    },
    canEditLead: {
      type: Boolean,
      default: true
    },
    canDeleteLead: {
      type: Boolean,
      default: false
    },
    canAssignLead: {
      type: Boolean,
      default: false
    },
    canExportLeads: {
      type: Boolean,
      default: false
    },
    canViewReports: {
      type: Boolean,
      default: false
    },
    canManageProducts: {
      type: Boolean,
      default: false
    },
    canGenerateQuotation: {
      type: Boolean,
      default: true
    },
    canSendCatalog: {
      type: Boolean,
      default: true
    },
    canManageFollowUps: {
      type: Boolean,
      default: true
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
}, {
  collection: 'departments',
  timestamps: true
});

// Index for better query performance
departmentSchema.index({ company: 1, isActive: 1 });
departmentSchema.index({ company: 1, name: 1 });

module.exports = mongoose.model('Department', departmentSchema);
