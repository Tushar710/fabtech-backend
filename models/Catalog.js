const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Industrial Equipment', 'Machinery', 'Tools', 'Components', 'Services', 'Other']
  },
  products: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    specifications: String,
    price: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    images: [String], // URLs to product images
    sku: String,
    availability: {
      type: String,
      enum: ['In Stock', 'Out of Stock', 'On Order', 'Discontinued'],
      default: 'In Stock'
    }
  }],
  coverImage: String, // URL to catalog cover image
  isActive: {
    type: Boolean,
    default: true
  },
  targetAudience: {
    type: String,
    enum: ['Manufacturing', 'Construction', 'Automotive', 'Textile', 'Food Processing', 'General Industry', 'All']
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  tags: [String],
  downloadCount: {
    type: Number,
    default: 0
  },
  sentToLeads: [{
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    method: {
      type: String,
      enum: ['Email', 'WhatsApp', 'Manual'],
      default: 'Email'
    }
  }]
}, {
  timestamps: true
});

// Index for better search performance
catalogSchema.index({ name: 'text', description: 'text', category: 1 });
catalogSchema.index({ companyId: 1, isActive: 1 });
catalogSchema.index({ targetAudience: 1 });

module.exports = mongoose.model('Catalog', catalogSchema);
