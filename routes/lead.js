const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Lead = require('../models/Lead');
const auth = require('../middleware/auth');

// POST /api/lead - Create a new lead
router.post('/', async (req, res) => {
  try {
    const {
      workflow,
      stage,
      title,
      description,
      product,
      customer,
      department,
      teamMember,
      amount,
      endDate,
      location,
      source,
      images,
      audioRecording,
      documentUpload,
      // Legacy fields
      name,
      email,
      phone,
      company,
      priority,
      value,
      notes,
      tags
    } = req.body;

    // Validate required fields (relaxed for development)
    // Use defaults if not provided
    const leadWorkflow = workflow || null;
    const leadTitle = title;
    const leadCustomer = customer || null;

    // Create new lead
    const lead = new Lead({
      workflow: leadWorkflow,
      stage: stage || 'new',
      title: leadTitle,
      description,
      product,
      customer: leadCustomer,
      department: Array.isArray(department) ? department : (department ? [department] : []),
      teamMember: Array.isArray(teamMember) ? teamMember : (teamMember ? [teamMember] : []),
      amount: amount || 0,
      endDate,
      location,
      source: source || 'direct',
      images: Array.isArray(images) ? images : (images ? [images] : []),
      audioRecording,
      documentUpload,
      // Legacy fields
      name,
      email,
      phone,
      company,
      priority: priority || 'medium',
      value: value || amount || 0,
      notes,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      userId: req.user?.id || '507f1f77bcf86cd799439011', // Default user ID when no auth
      lastContact: new Date()
    });

    const savedLead = await lead.save();
    
    // Populate references for response (only if they exist)
    try {
      if (savedLead.workflow) {
        await savedLead.populate({ path: 'workflow', select: 'name description' });
      }
      if (savedLead.customer) {
        await savedLead.populate({ path: 'customer', select: 'name email phone company' });
      }
      // Skip other populates for now to avoid errors
    } catch (populateError) {
      console.log('Populate warning (non-critical):', populateError.message);
    }

    res.status(201).json({
      message: 'Lead created successfully',
      lead: savedLead
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Server error while creating lead' });
  }
});

// POST /api/lead/bulk-import - Bulk import leads
router.post('/bulk-import', async (req, res) => {
  try {
    const leadsData = req.body.leads || [];
    if (!Array.isArray(leadsData) || leadsData.length === 0) {
      return res.status(400).json({ success: false, message: 'No leads provided for import' });
    }

    const formattedLeads = leadsData.map(item => {
      const leadName = item.name || item.customerName || 'Unknown Lead';
      const leadPhone = item.phone || item.contactNumber || '';
      const leadEmail = item.email || '';
      const leadCompany = item.companyName || item.customerCompany || item.company_name || '';
      return {
        name: leadName,
        customerName: leadName,
        phone: leadPhone,
        contactNumber: leadPhone,
        email: leadEmail ? leadEmail.toLowerCase() : '',
        address: item.address || '',
        companyName: leadCompany,
        customerCompany: leadCompany,
        company_name: leadCompany,
        productOfInterest: item.productOfInterest || 'Other',
        sector: item.sector || 'Other',
        sourceOfLead: item.sourceOfLead || item.source || 'Imported Excel',
        productCategory: item.productCategory || 'Standard',
        status: item.status || 'new',
        priority: item.priority || 'medium',
        value: Number(item.value) || 0,
        budget: item.budget || '',
        notes: item.notes || '',
        title: item.title || '',
        date: item.date ? new Date(item.date) : new Date()
      };
    });

    const inserted = await Lead.insertMany(formattedLeads, { ordered: false });
    res.status(201).json({ success: true, count: inserted.length, data: inserted });
  } catch (error) {
    console.error('Error during bulk import:', error);
    res.status(500).json({ success: false, message: 'Error bulk importing leads', error: error.message });
  }
});

// GET /api/lead - Get all leads
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 500000; // Default to high limit (500,000) to show all leads
    const skip = (page - 1) * limit;
    
    // Build query
    const query = req.user?.id ? { userId: req.user.id } : {}; // No user filter when no auth
    
    // Add filters if provided
    if (req.query.stage) {
      query.stage = req.query.stage;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.source) {
      query.source = req.query.source;
    }
    if (req.query.workflow) {
      query.workflow = req.query.workflow;
    }
    if (req.query.customer) {
      query.customer = req.query.customer;
    }
    
    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
        { location: searchRegex },
        { notes: searchRegex }
      ];
    }
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }
    
    // Sort options
    let sortOptions = { createdAt: -1 }; // Default sort by newest first
    if (req.query.sortBy) {
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sortOptions = { [sortBy]: sortOrder };
    }
    
    // Get leads without populate to avoid errors
    const leads = await Lead.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Lead.countDocuments(query);
    
    res.json({
      leads,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalLeads: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Server error while fetching leads' });
  }
});

// GET /api/lead/:id - Get a single lead by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lead ID' });
    }

    // Find lead without user filter and populate (simplified)
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ message: 'Server error while fetching lead' });
  }
});

// PUT /api/lead/:id - Update a lead
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lead ID' });
    }

    const lead = await Lead.findOne({ 
      _id: req.params.id, 
      userId: req.user?.id || '507f1f77bcf86cd799439011' 
    });
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Update fields
    const updateFields = [
      'workflow', 'stage', 'title', 'description', 'product', 'customer',
      'department', 'teamMember', 'amount', 'endDate', 'location', 'source',
      'images', 'audioRecording', 'documentUpload', 'name', 'email', 'phone',
      'company', 'status', 'priority', 'value', 'notes', 'tags', 'assignedTo',
      'followUps', 'socialProfiles'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (Array.isArray(req.body[field]) || typeof req.body[field] !== 'object') {
          lead[field] = req.body[field];
        } else if (field === 'socialProfiles' || field === 'captureSource') {
          lead[field] = { ...lead[field], ...req.body[field] };
        } else {
          lead[field] = req.body[field];
        }
      }
    });

    // Update lastContact if status changed or follow-up added
    if (req.body.status || req.body.followUps) {
      lead.lastContact = new Date();
    }

    const updatedLead = await lead.save();
    
    // Skip populate to avoid errors (simplified for development)
    // await updatedLead.populate([...]);
    
    res.json({
      message: 'Lead updated successfully',
      lead: updatedLead
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Server error while updating lead' });
  }
});

// DELETE /api/lead/:id - Delete a lead
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lead ID' });
    }

    // For development, allow deletion without strict user filtering
    const lead = await Lead.findByIdAndDelete(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: 'Server error while deleting lead' });
  }
});

// POST /api/lead/:id/follow-up - Add a follow-up to a lead
router.post('/:id/follow-up', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lead ID' });
    }

    const { type, summary, notes, nextStep, nextFollowUpDate, completed } = req.body;

    if (!type || !summary) {
      return res.status(400).json({ message: 'Type and summary are required for follow-up' });
    }

    const lead = await Lead.findOne({ 
      _id: req.params.id, 
      userId: req.user?.id || '507f1f77bcf86cd799439011' 
    });
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const followUp = {
      type,
      summary,
      notes,
      nextStep,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      completed: completed || false,
      date: new Date()
    };

    lead.followUps.push(followUp);
    lead.lastContact = new Date();

    await lead.save();
    
    res.json({
      message: 'Follow-up added successfully',
      followUp: lead.followUps[lead.followUps.length - 1]
    });
  } catch (error) {
    console.error('Error adding follow-up:', error);
    res.status(500).json({ message: 'Server error while adding follow-up' });
  }
});

// GET /api/lead/stats/dashboard - Get lead statistics
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total leads count
    const totalLeads = await Lead.countDocuments({ userId });
    
    // Get leads by stage
    const leadsByStage = await Lead.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ]);
    
    // Get leads by source
    const leadsBySource = await Lead.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    
    // Get total pipeline value
    const pipelineValue = await Lead.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get conversion rate
    const closedWonLeads = await Lead.countDocuments({ 
      userId, 
      stage: 'closed_won' 
    });
    const conversionRate = totalLeads > 0 ? (closedWonLeads / totalLeads * 100).toFixed(2) : 0;
    
    res.json({
      totalLeads,
      leadsByStage: leadsByStage.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      leadsBySource: leadsBySource.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      pipelineValue: pipelineValue[0]?.total || 0,
      conversionRate: parseFloat(conversionRate),
      closedWonLeads
    });
  } catch (error) {
    console.error('Error fetching lead statistics:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

module.exports = router;
