const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

// GET /api/customer - Get all customers
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = { userId: req.user.id, isActive: true };
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { company: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Customer.countDocuments(query);
    
    res.json({
      customers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCustomers: total
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error while fetching customers' });
  }
});

// POST /api/customer - Create a new customer
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, company, jobTitle, address, socialProfiles, tags, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ 
      email, 
      userId: req.user.id 
    });

    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this email already exists' });
    }

    const customer = new Customer({
      name,
      email,
      phone,
      company,
      jobTitle,
      address,
      socialProfiles,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      notes,
      userId: req.user.id
    });

    await customer.save();
    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Server error while creating customer' });
  }
});

module.exports = router;
