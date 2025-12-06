const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'email', 'phone', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date']
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    value: String,
    label: String
  }], // For select, radio, checkbox fields
  validation: {
    minLength: Number,
    maxLength: Number,
    pattern: String,
    min: Number,
    max: Number
  },
  order: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  formType: {
    type: String,
    enum: ['lead', 'both'], // lead = only lead forms, both = lead + autocapture
    default: 'both'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false // Making it optional for existing records
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

// Create compound index for company-specific unique field names
formFieldSchema.index({ name: 1, companyId: 1 }, { unique: true });

// Remove the old single field unique index if it exists
// This will be handled by dropping the old index manually

formFieldSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FormField', formFieldSchema);