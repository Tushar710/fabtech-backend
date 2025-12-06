const mongoose = require('mongoose');

const dropdownOptionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['productOfInterest', 'sector', 'sourceOfLead', 'productCategory', 'status', 'priority', 'leadStatus']
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null // null means company-level option
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

// Index for better performance
dropdownOptionSchema.index({ category: 1, companyId: 1, isActive: 1 });
dropdownOptionSchema.index({ companyId: 1, category: 1, sortOrder: 1 });
dropdownOptionSchema.index({ category: 1, companyId: 1, branchId: 1, isActive: 1 });

// Update timestamp on save
dropdownOptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DropdownOption', dropdownOptionSchema);
