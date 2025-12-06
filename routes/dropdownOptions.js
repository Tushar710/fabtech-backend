const express = require('express');
const router = express.Router();
const DropdownOption = require('../models/DropdownOption');
const auth = require('../middleware/auth');

// Get all dropdown options for a category
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    // Extract company ID and branch ID from token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let companyId = null;
    let branchId = null;
    let userType = null;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        companyId = decoded.companyId || decoded.id;
        branchId = decoded.branchId;
        userType = decoded.userType || decoded.type;
        console.log('🔍 Dropdown Options - Company ID:', companyId, 'Branch ID:', branchId, 'User Type:', userType);
      } catch (err) {
        // Try to decode without verification
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        companyId = decoded?.companyId || decoded?.id;
        branchId = decoded?.branchId;
        userType = decoded?.userType || decoded?.type;
        console.log('⚠️ Dropdown Options - Decoded - Company ID:', companyId, 'Branch ID:', branchId);
      }
    }

    // If user is a branch, ONLY fetch branch-specific options (no fallback to company)
    if (branchId && companyId && userType === 'branch') {
      const branchOptions = await DropdownOption.find({
        category,
        companyId,
        branchId,
        isActive: true
      }).sort({ sortOrder: 1, label: 1 });

      console.log(`📊 Found ${branchOptions.length} ${category} branch-specific options for branch ${branchId}`);
      return res.json(branchOptions);
    }

    // If user is company/admin, ONLY fetch company-level options (exclude branch options)
    if (companyId && !branchId) {
      const options = await DropdownOption.find({
        category,
        companyId,
        branchId: null, // Only company-level options, exclude branch-specific
        isActive: true
      }).sort({ sortOrder: 1, label: 1 });

      console.log(`📊 Found ${options.length} ${category} company-level options for company ${companyId}`);
      return res.json(options);
    }

    // If no company-specific options found and category is status, return hardcoded defaults
    if (category === 'status') {
      console.log('⚠️ No company-specific status options found, returning defaults');
      const defaultStatusOptions = [
        { label: 'New', value: 'new', sortOrder: 1 },
        { label: 'Contacted', value: 'contacted', sortOrder: 2 },
        { label: 'Qualified', value: 'qualified', sortOrder: 3 },
        { label: 'Proposal Sent', value: 'proposal_sent', sortOrder: 4 },
        { label: 'Negotiation', value: 'negotiation', sortOrder: 5 },
        { label: 'Follow Up', value: 'follow_up', sortOrder: 6 },
        { label: 'Demo Scheduled', value: 'demo_scheduled', sortOrder: 7 },
        { label: 'Quote Sent', value: 'quote_sent', sortOrder: 8 },
        { label: 'Closed Won', value: 'closed_won', sortOrder: 9 },
        { label: 'Closed Lost', value: 'closed_lost', sortOrder: 10 },
        { label: 'On Hold', value: 'on_hold', sortOrder: 11 },
        { label: 'Not Interested', value: 'not_interested', sortOrder: 12 }
      ];
      return res.json(defaultStatusOptions);
    }

    // For other categories without company ID, return empty array
    console.log(`⚠️ No options found for category: ${category}`);
    res.json([]);
  } catch (error) {
    console.error('Error fetching dropdown options:', error);
    res.status(500).json({ error: 'Failed to fetch dropdown options' });
  }
});

// Get all dropdown options for all categories
router.get('/', auth, async (req, res) => {
  try {
    const companyId = req.company?.id || req.user?.companyId;
    const branchId = req.branch?.id || req.user?.branchId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    let query = {
      companyId,
      isActive: true
    };

    // If branchId exists, get branch-specific options, otherwise get company-level options
    if (branchId) {
      query.branchId = branchId;
    } else {
      query.branchId = null; // Only company-level options
    }

    const options = await DropdownOption.find(query).sort({ category: 1, sortOrder: 1, label: 1 });

    // Group by category
    const groupedOptions = options.reduce((acc, option) => {
      if (!acc[option.category]) {
        acc[option.category] = [];
      }
      acc[option.category].push(option);
      return acc;
    }, {});

    res.json(groupedOptions);
  } catch (error) {
    console.error('Error fetching all dropdown options:', error);
    res.status(500).json({ error: 'Failed to fetch dropdown options' });
  }
});

// Create new dropdown option
router.post('/', auth, async (req, res) => {
  try {
    const { category, label, value, sortOrder, branchId } = req.body;
    const companyId = req.company?.id || req.user?.companyId;
    const createdBy = req.user?.id;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    if (!category || !label || !value) {
      return res.status(400).json({ error: 'Category, label, and value are required' });
    }

    // Check if option already exists for the same scope (company or branch)
    const existingOption = await DropdownOption.findOne({
      category,
      value,
      companyId,
      branchId: branchId || null,
      isActive: true
    });

    if (existingOption) {
      return res.status(400).json({ error: 'Option with this value already exists' });
    }

    const newOption = new DropdownOption({
      category,
      label,
      value,
      sortOrder: sortOrder || 0,
      companyId,
      branchId: branchId || null,
      createdBy
    });

    await newOption.save();
    res.status(201).json(newOption);
  } catch (error) {
    console.error('Error creating dropdown option:', error);
    res.status(500).json({ error: 'Failed to create dropdown option' });
  }
});

// Update dropdown option
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, value, sortOrder, isActive } = req.body;
    const companyId = req.company?.id || req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const option = await DropdownOption.findOne({ _id: id, companyId });
    if (!option) {
      return res.status(404).json({ error: 'Dropdown option not found' });
    }

    // Check if new value conflicts with existing options
    if (value && value !== option.value) {
      const existingOption = await DropdownOption.findOne({
        category: option.category,
        value,
        companyId,
        isActive: true,
        _id: { $ne: id }
      });

      if (existingOption) {
        return res.status(400).json({ error: 'Option with this value already exists' });
      }
    }

    // Update fields
    if (label !== undefined) option.label = label;
    if (value !== undefined) option.value = value;
    if (sortOrder !== undefined) option.sortOrder = sortOrder;
    if (isActive !== undefined) option.isActive = isActive;

    await option.save();
    res.json(option);
  } catch (error) {
    console.error('Error updating dropdown option:', error);
    res.status(500).json({ error: 'Failed to update dropdown option' });
  }
});

// Delete dropdown option (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.id || req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const option = await DropdownOption.findOne({ _id: id, companyId });
    if (!option) {
      return res.status(404).json({ error: 'Dropdown option not found' });
    }

    option.isActive = false;
    await option.save();

    res.json({ message: 'Dropdown option deleted successfully' });
  } catch (error) {
    console.error('Error deleting dropdown option:', error);
    res.status(500).json({ error: 'Failed to delete dropdown option' });
  }
});

// Bulk update sort order
router.put('/bulk/sort-order', auth, async (req, res) => {
  try {
    const { options } = req.body; // Array of { id, sortOrder }
    const companyId = req.company?.id || req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    if (!Array.isArray(options)) {
      return res.status(400).json({ error: 'Options array is required' });
    }

    // Update sort order for each option
    const updatePromises = options.map(({ id, sortOrder }) =>
      DropdownOption.updateOne(
        { _id: id, companyId },
        { sortOrder, updatedAt: new Date() }
      )
    );

    await Promise.all(updatePromises);
    res.json({ message: 'Sort order updated successfully' });
  } catch (error) {
    console.error('Error updating sort order:', error);
    res.status(500).json({ error: 'Failed to update sort order' });
  }
});

// Initialize default options for a company or branch
router.post('/initialize', auth, async (req, res) => {
  try {
    const companyId = req.company?.id || req.user?.companyId;
    const createdBy = req.user?.id;
    const { branchId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    // Check if options already exist for this scope
    const existingOptions = await DropdownOption.countDocuments({ 
      companyId,
      branchId: branchId || null
    });
    
    if (existingOptions > 0) {
      return res.status(400).json({ error: 'Dropdown options already initialized for this scope' });
    }

    const defaultOptions = [
      // Product of Interest
      { category: 'productOfInterest', label: 'ERP Software', value: 'ERP Software', sortOrder: 1 },
      { category: 'productOfInterest', label: 'CRM Software', value: 'CRM Software', sortOrder: 2 },
      { category: 'productOfInterest', label: 'Accounting Software', value: 'Accounting Software', sortOrder: 3 },
      { category: 'productOfInterest', label: 'Inventory Management', value: 'Inventory Management', sortOrder: 4 },
      { category: 'productOfInterest', label: 'HR Management', value: 'HR Management', sortOrder: 5 },
      { category: 'productOfInterest', label: 'Project Management', value: 'Project Management', sortOrder: 6 },
      { category: 'productOfInterest', label: 'E-commerce Solution', value: 'E-commerce Solution', sortOrder: 7 },
      { category: 'productOfInterest', label: 'Mobile App Development', value: 'Mobile App Development', sortOrder: 8 },
      { category: 'productOfInterest', label: 'Web Development', value: 'Web Development', sortOrder: 9 },
      { category: 'productOfInterest', label: 'Digital Marketing', value: 'Digital Marketing', sortOrder: 10 },
      { category: 'productOfInterest', label: 'Other', value: 'Other', sortOrder: 11 },

      // Sector
      { category: 'sector', label: 'Manufacturing', value: 'Manufacturing', sortOrder: 1 },
      { category: 'sector', label: 'Retail', value: 'Retail', sortOrder: 2 },
      { category: 'sector', label: 'Healthcare', value: 'Healthcare', sortOrder: 3 },
      { category: 'sector', label: 'Education', value: 'Education', sortOrder: 4 },
      { category: 'sector', label: 'Finance', value: 'Finance', sortOrder: 5 },
      { category: 'sector', label: 'Real Estate', value: 'Real Estate', sortOrder: 6 },
      { category: 'sector', label: 'Technology', value: 'Technology', sortOrder: 7 },
      { category: 'sector', label: 'Agriculture', value: 'Agriculture', sortOrder: 8 },
      { category: 'sector', label: 'Automotive', value: 'Automotive', sortOrder: 9 },
      { category: 'sector', label: 'Construction', value: 'Construction', sortOrder: 10 },
      { category: 'sector', label: 'Food & Beverage', value: 'Food & Beverage', sortOrder: 11 },
      { category: 'sector', label: 'Textile', value: 'Textile', sortOrder: 12 },
      { category: 'sector', label: 'Other', value: 'Other', sortOrder: 13 },

      // Source of Lead
      { category: 'sourceOfLead', label: 'Website', value: 'Website', sortOrder: 1 },
      { category: 'sourceOfLead', label: 'Referral', value: 'Referral', sortOrder: 2 },
      { category: 'sourceOfLead', label: 'Social Media', value: 'Social Media', sortOrder: 3 },
      { category: 'sourceOfLead', label: 'Email Campaign', value: 'Email Campaign', sortOrder: 4 },
      { category: 'sourceOfLead', label: 'Phone Call', value: 'Phone Call', sortOrder: 5 },
      { category: 'sourceOfLead', label: 'Trade Show', value: 'Trade Show', sortOrder: 6 },
      { category: 'sourceOfLead', label: 'Advertisement', value: 'Advertisement', sortOrder: 7 },
      { category: 'sourceOfLead', label: 'Cold Calling', value: 'Cold Calling', sortOrder: 8 },
      { category: 'sourceOfLead', label: 'Partner', value: 'Partner', sortOrder: 9 },
      { category: 'sourceOfLead', label: 'Other', value: 'Other', sortOrder: 10 },

      // Product Category
      { category: 'productCategory', label: 'Software', value: 'Software', sortOrder: 1 },
      { category: 'productCategory', label: 'Hardware', value: 'Hardware', sortOrder: 2 },
      { category: 'productCategory', label: 'Services', value: 'Services', sortOrder: 3 },
      { category: 'productCategory', label: 'Consulting', value: 'Consulting', sortOrder: 4 },
      { category: 'productCategory', label: 'Support', value: 'Support', sortOrder: 5 },
      { category: 'productCategory', label: 'Training', value: 'Training', sortOrder: 6 },
      { category: 'productCategory', label: 'Other', value: 'Other', sortOrder: 7 },

      // Priority
      { category: 'priority', label: 'Low', value: 'low', sortOrder: 1 },
      { category: 'priority', label: 'Medium', value: 'medium', sortOrder: 2 },
      { category: 'priority', label: 'High', value: 'high', sortOrder: 3 },
      { category: 'priority', label: 'Urgent', value: 'urgent', sortOrder: 4 },

      // Status
      { category: 'status', label: 'New', value: 'new', sortOrder: 1 },
      { category: 'status', label: 'Contacted', value: 'contacted', sortOrder: 2 },
      { category: 'status', label: 'Qualified', value: 'qualified', sortOrder: 3 },
      { category: 'status', label: 'Proposal Sent', value: 'proposal_sent', sortOrder: 4 },
      { category: 'status', label: 'Negotiation', value: 'negotiation', sortOrder: 5 },
      { category: 'status', label: 'Follow Up', value: 'follow_up', sortOrder: 6 },
      { category: 'status', label: 'Demo Scheduled', value: 'demo_scheduled', sortOrder: 7 },
      { category: 'status', label: 'Quote Sent', value: 'quote_sent', sortOrder: 8 },
      { category: 'status', label: 'Closed Won', value: 'closed_won', sortOrder: 9 },
      { category: 'status', label: 'Closed Lost', value: 'closed_lost', sortOrder: 10 },
      { category: 'status', label: 'On Hold', value: 'on_hold', sortOrder: 11 },
      { category: 'status', label: 'Not Interested', value: 'not_interested', sortOrder: 12 }
    ];

    // Add company, branch, and user info to each option
    const optionsToCreate = defaultOptions.map(option => ({
      ...option,
      companyId,
      branchId: branchId || null,
      createdBy
    }));

    await DropdownOption.insertMany(optionsToCreate);
    
    const scope = branchId ? 'branch' : 'company';
    res.json({ 
      message: `Default dropdown options initialized successfully for ${scope}`, 
      count: optionsToCreate.length 
    });
  } catch (error) {
    console.error('Error initializing dropdown options:', error);
    res.status(500).json({ error: 'Failed to initialize dropdown options' });
  }
});

module.exports = router;
