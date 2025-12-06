const mongoose = require('mongoose');

// Schema for FABTECH company employees
const employeeSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: false // Optional - employees can be company-level without specific branch
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  teamMemberName: {
    type: String,
    required: true
  },
  teamMemberEmail: {
    type: String
  },
  mobileNumber: {
    type: String
  },
  emergencyMobileNumber: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  salary: {
    type: String
  },
  dateOfJoining: {
    type: Date
  },
  shift: {
    type: String
  },
  employeeId: {
    type: String
  },
  role: {
    type: String,
    enum: ['Employee', 'Manager', 'Team Lead', 'Sales Executive', 'Admin', 'Branch Admin'],
    default: 'Employee'
  },
  isBranchAdmin: {
    type: Boolean,
    default: false
  },
  designation: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  aadharNumber: {
    type: String
  },
  panNumber: {
    type: String
  },
  userUpi: {
    type: String
  },
  userId: {
    type: String
  },
  weeklyHoliday: {
    type: [Number], // Sunday = 0, Monday = 1, etc.
    default: [0] // Sunday default
  },
  address: {
    type: String
  },
  accessPermissions: {
    type: [String],
    default: []
  },
  profileImage: {
    type: String
  },
  adharImage: {
    type: String
  },
  panImage: {
    type: String
  },
  creditPoints: {
    type: Number,
    default: 0
  },
  paidLeaves: [{
    type: {
      type: String
    },
    count: {
      type: Number
    }
  }],
  documents: {
    type: [String],
    default: []
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
  collection: 'employees' // Use existing collection name
});

// Index for better query performance
employeeSchema.index({ company: 1, isActive: 1 });
employeeSchema.index({ branch: 1, isActive: 1 });
employeeSchema.index({ department: 1, isActive: 1 });
employeeSchema.index({ teamMemberEmail: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ company: 1, branch: 1 });
employeeSchema.index({ company: 1, department: 1 });

// Virtual for name (for compatibility)
employeeSchema.virtual('name').get(function() {
  return this.teamMemberName;
});

// Virtual for phone (for compatibility)
employeeSchema.virtual('phone').get(function() {
  return this.mobileNumber || this.emergencyMobileNumber;
});

// Ensure virtual fields are serialized
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Employee', employeeSchema);
