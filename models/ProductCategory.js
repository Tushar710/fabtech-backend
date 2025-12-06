const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'dropdown', 'multiselect'],
    default: 'text'
  },
  options: [String], // For dropdown/multiselect
  unit: String, // e.g., 'kg', 'mm', 'inches'
  required: {
    type: Boolean,
    default: false
  }
});

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  specifications: [specificationSchema]
});

const productCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Trading', 'Inhouse'],
    required: true
  },
  subCategories: [subCategorySchema],
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

module.exports = mongoose.model('ProductCategory', productCategorySchema);
