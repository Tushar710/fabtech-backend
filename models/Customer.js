const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  socialProfiles: {
    linkedin: String,
    facebook: String,
    twitter: String,
    instagram: String,
    website: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
customerSchema.index({ userId: 1, email: 1 });
customerSchema.index({ userId: 1, company: 1 });

module.exports = mongoose.model('Customer', customerSchema);
