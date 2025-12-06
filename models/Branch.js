const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema for branches collection
const branchSchema = new mongoose.Schema({
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
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  // Branch Login Credentials
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    select: false // Don't return password by default
  },
  branchCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  // Access Permissions for Branch
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
  isActive: {
    type: Boolean,
    default: true
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
  collection: 'branches'
});

// Hash password before saving
branchSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
branchSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Index for better query performance
branchSchema.index({ company: 1 });
branchSchema.index({ name: 1 });
branchSchema.index({ isActive: 1 });
branchSchema.index({ username: 1 });
branchSchema.index({ branchCode: 1 });

module.exports = mongoose.model('Branch', branchSchema);
