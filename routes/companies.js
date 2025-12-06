const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const { validationResult, body } = require('express-validator');

// Get all companies
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching all companies');
    const companies = await Company.find({})
      .sort({ businessName: 1 });

    console.log(`📊 Found ${companies.length} companies`);
    res.json({
      success: true,
      data: companies
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies'
    });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    const company = await Company.findById(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company'
    });
  }
});

// Create company
router.post('/', [
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('businessEmail').isEmail().withMessage('Valid business email is required'),
  body('businessPhone').notEmpty().withMessage('Business phone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const company = new Company(req.body);
    await company.save();

    console.log('✅ Company created:', company.businessName);
    res.status(201).json({
      success: true,
      data: company,
      message: 'Company created successfully'
    });

  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company'
    });
  }
});

// Update company
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    const company = await Company.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    console.log('✅ Company updated:', company.businessName);
    res.json({
      success: true,
      data: company,
      message: 'Company updated successfully'
    });

  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company'
    });
  }
});

// Delete company
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    const company = await Company.findByIdAndDelete(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    console.log('✅ Company deleted:', company.businessName);
    res.json({
      success: true,
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company'
    });
  }
});

module.exports = router;
