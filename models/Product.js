const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Trading', 'Inhouse'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subCategory: String,
  specifications: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  price: {
    type: Number,
    required: true
  },
  description: String,
  images: [String],
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient filtering
productSchema.index({ type: 1, category: 1, subCategory: 1, company: 1 });

module.exports = mongoose.model('Product', productSchema);
