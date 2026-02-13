const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Lead = require('../models/Lead');
const auth = require('../middleware/auth');
const { sendWelcomeMessage } = require('./whatsappSimple');

// GET /api/leads - Get all leads for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Default to high limit to show all leads
    const skip = (page - 1) * limit;
    
    // Build query with company filtering
    const query = {};
    
    // Filter by company if user is not superadmin
    if (req.companyId) {
      query.companyId = req.companyId;
    }
    
    // Filter by branch if user has a branch assigned
    // This ensures users only see leads assigned to their branch
    if (req.branchId && req.query.filterByBranch !== 'false') {
      query.assignedBranch = req.branchId;
    }
    
    // IMPORTANT: Exclude branch-related leads from Lead Management dashboard
    // Branch-related leads (created by branch OR assigned to branch) should only appear in Branch Tracking dashboard
    if (!req.branchId) {
      // For company view, exclude:
      // 1. Leads created by branches (createdByBranch exists)
      // 2. Leads assigned to branches (assignedBranch exists)
      // Show only unassigned leads that company/employees created
      query.$and = [
        {
          $or: [
            { createdByBranch: { $exists: false } },
            { createdByBranch: null }
          ]
        },
        {
          $or: [
            { assignedBranch: { $exists: false } },
            { assignedBranch: null }
          ]
        }
      ];
      console.log('🏢 Company view: Excluding branch-related leads from Lead Management');
    }
    
    // Add filters if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.source) {
      query.source = req.query.source;
    }
    if (req.query.branch) {
      query.assignedBranch = req.query.branch;
    }
    
    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { companyName: searchRegex },
        { notes: searchRegex }
      ];
    }
    
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get Quotation model to fetch rejected quotations
    const Quotation = require('../models/Quotation');
    
    // Add default title and fetch rejected quotation info for each lead
    const leadsWithTitle = await Promise.all(leads.map(async (lead) => {
      // Find the most recent rejected quotation for this lead
      const rejectedQuotation = await Quotation.findOne({
        lead: lead._id,
        status: 'rejected',
        rejectionReason: { $exists: true, $ne: null, $ne: '' }
      })
      .sort({ rejectedAt: -1 })
      .select('rejectionReason rejectedAt quotationNumber')
      .lean();
      
      return {
        ...lead,
        title: lead.title || `${lead.name || 'Lead'} - ${lead.companyName || 'General Enquiry'}`,
        rejectedQuotation: rejectedQuotation || null
      };
    }));

    const total = await Lead.countDocuments(query);
    
    res.json({
      leads: leadsWithTitle,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Server error while fetching leads' });
  }
});

// PATCH /api/leads/:id/unassign-employee - Unassign lead from employee
// IMPORTANT: This must come BEFORE the /:id route to avoid route matching issues
router.patch('/:id/unassign-employee', auth, async (req, res) => {
  try {
    console.log('🔄 Unassigning lead from employee:', req.params.id);
    
    let query = { _id: req.params.id };
    if (req.companyId) {
      query.companyId = req.companyId;
    }
    
    const lead = await Lead.findOne(query);
    
    if (!lead) {
      console.log('❌ Lead not found:', req.params.id);
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    // Check if lead is assigned to an employee
    if (!lead.assignedEmployee && !lead.assignedEmployeeName) {
      console.log('⚠️ Lead is not assigned to any employee');
      return res.status(400).json({ message: 'Lead is not assigned to any employee' });
    }
    
    console.log('👤 Removing employee assignment:', lead.assignedEmployeeName);
    
    // Remove employee assignment
    lead.assignedEmployee = null;
    lead.assignedEmployeeName = null;
    lead.lastContact = new Date();
    
    await lead.save();
    
    console.log('✅ Lead unassigned from employee successfully');
    res.json({ 
      message: 'Lead unassigned from employee successfully',
      lead 
    });
  } catch (error) {
    console.error('❌ Error unassigning lead from employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/leads/:id/unassign-branch - Unassign lead from branch
// IMPORTANT: This must come BEFORE the /:id route to avoid route matching issues
router.patch('/:id/unassign-branch', auth, async (req, res) => {
  try {
    console.log('🔄 Unassigning lead from branch:', req.params.id);
    
    let query = { _id: req.params.id };
    if (req.companyId) {
      query.companyId = req.companyId;
    }
    
    const lead = await Lead.findOne(query);
    
    if (!lead) {
      console.log('❌ Lead not found:', req.params.id);
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    // Check if lead is assigned to a branch
    if (!lead.assignedBranch) {
      console.log('⚠️ Lead is not assigned to any branch');
      return res.status(400).json({ message: 'Lead is not assigned to any branch' });
    }
    
    console.log('🏢 Removing branch assignment:', lead.assignedBranch);
    
    // Remove branch assignment
    lead.assignedBranch = null;
    lead.assignedBranchName = null;
    lead.lastContact = new Date();
    
    await lead.save();
    
    console.log('✅ Lead unassigned from branch successfully');
    res.json({ 
      message: 'Lead unassigned from branch successfully',
      lead 
    });
  } catch (error) {
    console.error('❌ Error unassigning lead from branch:', error);
    res.status(500).json({ message: 'Server error while unassigning lead from branch' });
  }
});

// GET /api/leads/:id - Get a single lead
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Filter by company if user is not superadmin
    if (req.companyId) {
      query.companyId = req.companyId;
    }
    
    const lead = await Lead.findOne(query);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ message: 'Server error while fetching lead' });
  }
});

// POST /api/leads - Create a new lead
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 Backend received lead data:', req.body);
    const {
      customerName,
      contactName,
      contactNumber,
      name,
      phone,
      email,
      address,
      customerCompany,
      companyName,
      company_name,
      productOfInterest,
      sector,
      sourceOfLead,
      productCategory,
      status,
      priority,
      value,
      budget,
      notes,
      title,
      date
    } = req.body;
    
    console.log('📅 Backend received date:', date);
    console.log('📅 Converting date to:', date ? new Date(date + 'T12:00:00.000Z') : new Date());
    
    // Map field names for compatibility
    const leadName = name || customerName;
    const leadPhone = phone || contactNumber; // Remove contactName mapping
    const leadCompany = companyName || company_name || customerCompany;
    const leadEmail = email;
    
    // Validation - only name and company are required, email is optional
    if (!leadName || !leadCompany) {
      return res.status(400).json({ 
        message: 'Customer name and company are required' 
      });
    }
    
    // Allow duplicate emails - multiple leads with same email are permitted
    // This is intentional as per user requirements
    
    // Extract assignedBranch and company from request body
    const { assignedBranch, company } = req.body;
    
    console.log('🏢 Branch Assignment:', assignedBranch);
    console.log('🏭 Company Assignment:', company);
    
    // Determine if this lead is being created by a branch
    const createdByBranch = req.branchId || null;
    
    console.log('🏢 Lead creation context:', {
      branchId: req.branchId,
      companyId: req.companyId,
      userId: req.user.id,
      createdByBranch: createdByBranch ? 'Yes' : 'No'
    });
    
    // IMPORTANT: Sync source and sourceOfLead fields - prioritize req.body.source (from AutoCapture)
    const leadSource = req.body.source || sourceOfLead || 'Website';
    console.log('📍 Source field mapping:', {
      'req.body.source': req.body.source,
      'sourceOfLead': sourceOfLead,
      'finalSource': leadSource
    });
    
    const lead = new Lead({
      name: leadName,
      customerName: leadName,
      phone: leadPhone,
      contactNumber: leadPhone, // Use contactNumber instead of contactName
      email: leadEmail.toLowerCase(),
      address: address || '',
      companyName: leadCompany,
      customerCompany: leadCompany,
      company_name: leadCompany,
      productOfInterest: productOfInterest || 'Other',
      sector: sector || 'Other',
      source: leadSource,
      sourceOfLead: leadSource, // Sync both fields with same value
      productCategory: productCategory || 'Software',
      status: status || 'new',
      priority: priority || 'medium',
      value: value || 0,
      budget: budget || '',
      notes: notes || '',
      title: title || 'New Lead',
      date: date ? new Date(date + 'T12:00:00.000Z') : new Date(),
      createdAt: new Date(),
      lastContact: new Date(),
      userId: req.user.id,
      companyId: req.companyId || 'superadmin',
      assignedBranch: assignedBranch || null,
      company: company?._id || company || null,
      createdByBranch: createdByBranch // Set if created by branch
    });
    
    await lead.save();
    
    // Send welcome WhatsApp message if enabled and phone number is valid
    const { getCurrentSettings } = require('./whatsappSettings');
    const whatsappSettings = getCurrentSettings();
    
    if (whatsappSettings.welcomeMessageEnabled && leadPhone && leadPhone.length > 0) {
      console.log('📱 Sending welcome message to new lead:', leadName);
      const welcomeMessage = whatsappSettings.welcomeMessage.replace('{name}', leadName);
      
      // Send welcome message (don't wait for response to avoid blocking lead creation)
      sendWelcomeMessage(leadPhone, welcomeMessage)
        .then(result => {
          if (result.success) {
            console.log('✅ Welcome message sent successfully to:', leadPhone);
          } else {
            console.log('❌ Failed to send welcome message:', result.error);
          }
        })
        .catch(error => {
          console.log('❌ Error sending welcome message:', error.message);
        });
    } else {
      if (!whatsappSettings.welcomeMessageEnabled) {
        console.log('📱 WhatsApp messaging is disabled');
      } else {
        console.log('📱 Skipping WhatsApp message - invalid or missing phone number:', leadPhone);
      }
    }
    
    res.status(201).json({
      message: 'Lead created successfully',
      lead
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Server error while creating lead' });
  }
});

// PUT /api/leads/:id - Update a lead
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('🔄 PUT /api/leads/:id - Update request received');
    console.log('📋 Request body:', req.body);
    console.log('📅 Date in request:', req.body.date);
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lead ID format' });
    }

    const {
      name,
      customerName,
      email,
      phone,
      contactNumber,
      company,
      customerCompany,
      source,
      sourceOfLead,
      status,
      statusReason,
      priority,
      value,
      budget,
      notes,
      address,
      productOfInterest,
      sector,
      productCategory,
      date
    } = req.body;
    
    let query = { _id: req.params.id };
    if (req.companyId) {
      query.companyId = req.companyId;
    }
    
    const lead = await Lead.findOne(query);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    // Update fields - match the Lead model schema
    if (name || customerName) lead.customerName = customerName || name;
    if (email) lead.email = email.toLowerCase();
    if (phone !== undefined || contactNumber !== undefined) lead.contactNumber = contactNumber || phone;
    if (company !== undefined || customerCompany !== undefined) lead.customerCompany = customerCompany || company;
    if (source || sourceOfLead) lead.sourceOfLead = sourceOfLead || source;
    if (status) {
      lead.status = status;
      lead.statusUpdatedAt = new Date();
    }
    if (statusReason !== undefined) lead.statusReason = statusReason;
    if (priority) lead.priority = priority;
    if (value !== undefined) lead.value = value;
    if (budget !== undefined) lead.budget = budget;
    if (notes !== undefined) lead.notes = notes;
    if (address !== undefined) lead.address = address;
    if (productOfInterest !== undefined) lead.productOfInterest = productOfInterest;
    if (sector !== undefined) lead.sector = sector;
    if (productCategory !== undefined) lead.productCategory = productCategory;
    if (date !== undefined) {
      console.log('📅 Updating date field from:', lead.date, 'to:', date);
      lead.date = new Date(date); // Update the date field
      console.log('📅 Date after update:', lead.date);
    }
    
    // Handle any additional custom fields
    Object.keys(req.body).forEach(key => {
      if (!['name', 'customerName', 'email', 'phone', 'contactNumber', 'company', 'customerCompany', 'source', 'sourceOfLead', 'status', 'priority', 'value', 'budget', 'notes', 'address', 'productOfInterest', 'sector', 'productCategory', 'date'].includes(key)) {
        lead[key] = req.body[key];
      }
    });
    
    lead.lastContact = new Date();
    
    console.log('💾 Saving lead to database...');
    const savedLead = await lead.save();
    console.log('✅ Lead saved successfully');
    console.log('📅 Final saved date:', savedLead.date);
    
    // Return the updated lead with proper date formatting
    res.json({
      message: 'Lead updated successfully',
      lead: savedLead.toObject()
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ message: 'Server error while updating lead' });
  }
});

// DELETE /api/leads/:id - Delete a lead
router.delete('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.companyId) {
      query.companyId = req.companyId;
    }
    
    const lead = await Lead.findOne(query);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    await Lead.deleteOne(query);
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: 'Server error while deleting lead' });
  }
});

// GET /api/leads/stats/summary - Get lead statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await Lead.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalValue: { $sum: '$value' },
          statusBreakdown: {
            $push: {
              status: '$status',
              value: '$value'
            }
          }
        }
      }
    ]);
    
    const statusCounts = await Lead.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]);
    
    res.json({
      total: stats[0]?.total || 0,
      totalValue: stats[0]?.totalValue || 0,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          totalValue: item.totalValue
        };
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
});

module.exports = router;
