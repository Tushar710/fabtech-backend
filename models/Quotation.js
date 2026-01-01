const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false // Made optional to support manual entries
  },
  productName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  productImage: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    required: true,
    unique: true
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  leadName: {
    type: String,
    required: true
  },
  leadEmail: {
    type: String,
    required: true
  },
  leadPhone: {
    type: String
  },
  leadCompany: {
    type: String
  },
  leadAddress: {
    type: String
  },
  leadGST: {
    type: String
  },
  items: [quotationItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 18, // GST rate in India
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  validUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft'
  },
  notes: {
    type: String
  },
  termsAndConditions: {
    type: String,
    default: 'Payment terms: 30 days from invoice date. Prices are subject to change without notice.'
  },
  warranty: {
    type: String
  },
  companyInfo: {
    type: Object
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    required: true
  },
  createdByModel: {
    type: String,
    enum: ['User', 'Employee'],
    default: 'User'
  },
  sentAt: {
    type: Date
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

// Generate quotation number before saving (if not provided)
quotationSchema.pre('save', async function (next) {
  if (this.isNew && !this.quotationNumber) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const nextYear = currentYear + 1;
    const yearShort = currentYear.toString().slice(-2);
    const nextYearShort = nextYear.toString().slice(-2);

    const count = await mongoose.model('Quotation').countDocuments({
      quotationNumber: { $regex: `^KFT-${yearShort}` }
    });

    this.quotationNumber = `KFT-${yearShort}/${nextYearShort}-${count + 1}`;
  }
  next();
});

// Calculate totals before saving
quotationSchema.pre('save', function (next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.taxAmount = (this.subtotal * this.taxRate) / 100;
  this.totalAmount = this.subtotal + this.taxAmount;
  next();
});

// Index for better query performance
quotationSchema.index({ createdBy: 1, status: 1 });
quotationSchema.index({ lead: 1 });
quotationSchema.index({ quotationNumber: 1 });

module.exports = mongoose.model('Quotation', quotationSchema);
