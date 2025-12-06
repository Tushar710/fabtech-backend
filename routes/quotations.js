const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Product = require('../models/Product');
const Lead = require('../models/Lead');
const auth = require('../middleware/auth');

// Generate unique quotation number in format: KFT-25/26-156
async function generateQuotationNumber() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const nextYear = currentYear + 1;
  const yearShort = currentYear.toString().slice(-2);
  const nextYearShort = nextYear.toString().slice(-2);
  const prefix = `KFT-${yearShort}/${nextYearShort}-`;
  
  // Find all quotations for this year and extract numbers
  const quotations = await Quotation.find({
    quotationNumber: { $regex: `^KFT-${yearShort}/${nextYearShort}-` }
  }).select('quotationNumber');
  
  let maxNumber = 0;
  
  // Extract all numbers and find the maximum
  quotations.forEach(q => {
    const parts = q.quotationNumber.split('-');
    if (parts.length >= 3) {
      const num = parseInt(parts[2]);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  });
  
  const nextNumber = maxNumber + 1;
  
  return `${prefix}${nextNumber}`;
}

// Get all quotations for a user
router.get('/', auth, async (req, res) => {
  try {
    const { status, leadId } = req.query;
    const filter = { createdBy: req.user.id };
    
    if (status) filter.status = status;
    if (leadId) filter.lead = leadId;
    
    const quotations = await Quotation.find(filter)
      .populate('lead', 'name email phone')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });
    
    res.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single quotation
router.get('/:id', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    })
    .populate('lead', 'name email phone')
    .populate('items.product', 'name sku description');
    
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    
    res.json(quotation);
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new quotation
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received quotation request body:', req.body);
    
    const {
      leadId,
      items,
      taxRate,
      validUntil,
      notes,
      termsAndConditions
    } = req.body;

    console.log('Extracted leadId:', leadId);
    console.log('Extracted items:', items);

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    console.log('Found lead:', lead.customerName, lead.email);

    // Generate quotation number
    const quotationNumber = await generateQuotationNumber();

    // Process items and calculate totals
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      const discount = item.discount || 0;
      const finalUnitPrice = product.price * (1 - discount / 100);
      const totalPrice = finalUnitPrice * item.quantity;
      subtotal += totalPrice;

      processedItems.push({
        product: product._id,
        productName: product.name,
        description: item.description || product.description,
        productImage: item.productImage || (product.images && product.images.length > 0 ? product.images[0] : ''),
        quantity: item.quantity,
        unitPrice: finalUnitPrice,
        discount: discount,
        totalPrice: totalPrice
      });
    }

    // Calculate tax and total
    const taxAmount = (subtotal * (taxRate || 18)) / 100;
    const totalAmount = subtotal + taxAmount;

    const quotation = new Quotation({
      quotationNumber,
      lead: leadId,
      leadName: lead.customerName || lead.name,
      leadEmail: lead.email,
      leadPhone: lead.contactNumber || lead.phone,
      leadCompany: req.body.leadCompany || lead.company || lead.customerName,
      leadAddress: req.body.leadAddress || lead.address,
      leadGST: req.body.leadGST || lead.gstNumber,
      items: processedItems,
      subtotal,
      taxRate: taxRate || 18,
      taxAmount,
      totalAmount,
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes,
      termsAndConditions,
      warranty: req.body.warranty,
      companyInfo: req.body.companyInfo,
      createdBy: req.user.id
    });

    await quotation.save();
    
    // Update lead status to "Quoted" and increment quotation count
    await Lead.findByIdAndUpdate(leadId, { 
      status: 'Quoted',
      lastQuotationDate: new Date(),
      $inc: { quotationCount: 1 }
    });
    
    // Populate the response
    await quotation.populate('lead', 'name email phone');
    await quotation.populate('items.product', 'name sku');
    
    res.status(201).json(quotation);
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update quotation
router.put('/:id', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Don't allow updates to sent/accepted quotations
    if (quotation.status === 'accepted') {
      return res.status(400).json({ message: 'Cannot update accepted quotation' });
    }

    Object.assign(quotation, req.body);
    await quotation.save();
    
    await quotation.populate('lead', 'name email phone');
    await quotation.populate('items.product', 'name sku');
    
    res.json(quotation);
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send quotation
router.post('/:id/send', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    quotation.status = 'sent';
    quotation.sentAt = new Date();
    await quotation.save();
    
    // Here you would integrate with email service
    // For now, we'll just update the status
    
    res.json({ message: 'Quotation sent successfully', quotation });
  } catch (error) {
    console.error('Error sending quotation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept quotation
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    quotation.status = 'accepted';
    quotation.acceptedAt = new Date();
    await quotation.save();
    
    // Update lead status to "Accepted"
    await Lead.findByIdAndUpdate(quotation.lead, { 
      status: 'Accepted'
    });
    
    res.json({ message: 'Quotation accepted', quotation });
  } catch (error) {
    console.error('Error accepting quotation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject quotation
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    quotation.status = 'rejected';
    quotation.rejectedAt = new Date();
    quotation.rejectionReason = rejectionReason;
    await quotation.save();
    
    // Update lead status to "Rejected"
    await Lead.findByIdAndUpdate(quotation.lead, { 
      status: 'Rejected'
    });
    
    res.json({ message: 'Quotation rejected', quotation });
  } catch (error) {
    console.error('Error rejecting quotation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete quotation
router.delete('/:id', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    
    const leadId = quotation.lead;
    
    // Delete the quotation
    await Quotation.findByIdAndDelete(req.params.id);
    
    // Update lead: decrement quotation count
    await Lead.findByIdAndUpdate(leadId, { 
      $inc: { quotationCount: -1 }
    });
    
    // Check if this was the last quotation for this lead
    const remainingQuotations = await Quotation.countDocuments({ lead: leadId });
    
    // If no more quotations, update lead status back to previous state
    if (remainingQuotations === 0) {
      await Lead.findByIdAndUpdate(leadId, { 
        status: 'contacted', // or whatever default status you want
        lastQuotationDate: null
      });
    }
    
    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
