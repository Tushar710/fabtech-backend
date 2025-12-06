const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema for multi-company system
const companySchema = new mongoose.Schema({
  // Company Authentication
  companyCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Company Basic Info
  superadminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Superadmin',
    required: false // Made optional for new system
  },
  businessName: {
    type: String,
    required: true
  },
  businessEmail: {
    type: String,
    required: true,
    unique: true
  },
  businessPhone: {
    type: String,
    required: true
  },
  emergencyMobile: {
    type: String
  },
  businessAddress: {
    type: String
  },
  businessLogo: {
    type: String
  },
  businessCreatedDate: {
    type: Date,
    default: Date.now
  },
  businessSubscriptionPlan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    default: 'premium'
  },
  
  // Company Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Database Configuration
  databaseName: {
    type: String,
    required: true,
    unique: true
  },
  weeklyHoliday: {
    type: [Number],
    default: [1] // Sunday = 1
  },
  address: {
    type: String
  },
  businessCategory: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Quotation Settings
  quotationSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  collection: 'companies', // Use existing collection name
  timestamps: true
});

// Hash password before saving
companySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
companySchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Index for better query performance
companySchema.index({ superadminId: 1 });
companySchema.index({ businessEmail: 1 });
companySchema.index({ companyCode: 1 });
companySchema.index({ databaseName: 1 });

module.exports = mongoose.model('Company', companySchema);
