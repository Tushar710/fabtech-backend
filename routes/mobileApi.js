const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const FollowUp = require('../models/FollowUp');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ==================== LEAD MANAGEMENT APIs ====================

// POST /api/mobile/leads - Add new lead
router.post('/leads', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      title,
      source,
      budget,
      notes,
      priority = 'medium',
      status = 'new'
    } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required fields'
      });
    }

    // Create new lead
    const lead = new Lead({
      name,
      email,
      phone,
      company,
      title,
      source: source || 'mobile_app',
      budget,
      notes,
      priority,
      status,
      createdAt: new Date(),
      lastContact: new Date()
    });

    await lead.save();

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });

  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lead',
      error: error.message
    });
  }
});

// GET /api/mobile/leads - Get all leads with filters
router.get('/leads', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Add filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.source) query.source = req.query.source;
    if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;
    
    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex }
      ];
    }
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('followUps')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalLeads = await Lead.countDocuments(query);
    const totalPages = Math.ceil(totalLeads / limit);

    res.json({
      success: true,
      data: leads,
      pagination: {
        currentPage: page,
        totalPages,
        totalLeads,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: error.message
    });
  }
});

// GET /api/mobile/leads/:id - Get single lead by ID
router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email phone')
      .populate('followUps');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });

  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead',
      error: error.message
    });
  }
});

// PUT /api/mobile/leads/:id - Update lead
router.put('/leads/:id', async (req, res) => {
  try {
    const leadId = req.params.id;
    const updateData = req.body;

    // Add lastContact timestamp when updating
    updateData.lastContact = new Date();

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });

  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead',
      error: error.message
    });
  }
});

// ==================== LEAD ASSIGNMENT APIs ====================

// POST /api/mobile/leads/:id/assign - Assign lead to employee
router.post('/leads/:id/assign', async (req, res) => {
  try {
    const { employeeId, notes } = req.body;
    const leadId = req.params.id;

    // Validate employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update lead with assignment
    const lead = await Lead.findByIdAndUpdate(
      leadId,
      {
        assignedTo: employeeId,
        status: 'assigned',
        assignedAt: new Date(),
        lastContact: new Date(),
        $push: {
          notes: {
            text: notes || `Lead assigned to ${employee.name}`,
            createdAt: new Date(),
            createdBy: 'system'
          }
        }
      },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead assigned successfully',
      data: lead
    });

  } catch (error) {
    console.error('Error assigning lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign lead',
      error: error.message
    });
  }
});

// GET /api/mobile/employees - Get all employees for assignment
router.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find({ status: 'active' })
      .select('name email phone department position')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: employees
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
});

// ==================== FOLLOW-UP APIs ====================

// POST /api/mobile/leads/:id/followup - Add follow-up to lead
router.post('/leads/:id/followup', async (req, res) => {
  try {
    const {
      type,
      notes,
      nextFollowUpDate,
      priority = 'medium',
      status = 'pending'
    } = req.body;

    const leadId = req.params.id;

    // Validate lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Create follow-up
    const followUp = new FollowUp({
      leadId,
      type: type || 'call',
      notes,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      priority,
      status,
      createdAt: new Date()
    });

    await followUp.save();

    // Update lead with follow-up reference
    await Lead.findByIdAndUpdate(leadId, {
      $push: { followUps: followUp._id },
      lastContact: new Date(),
      status: status === 'completed' ? 'contacted' : lead.status
    });

    res.status(201).json({
      success: true,
      message: 'Follow-up added successfully',
      data: followUp
    });

  } catch (error) {
    console.error('Error adding follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add follow-up',
      error: error.message
    });
  }
});

// GET /api/mobile/followups - Get all follow-ups with filters
router.get('/followups', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Add filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.type) query.type = req.query.type;
    if (req.query.employeeId) query.assignedTo = req.query.employeeId;
    
    // Date range filter for follow-up date
    if (req.query.startDate && req.query.endDate) {
      query.nextFollowUpDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const followUps = await FollowUp.find(query)
      .populate('leadId', 'name email phone company status')
      .populate('assignedTo', 'name email')
      .sort({ nextFollowUpDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalFollowUps = await FollowUp.countDocuments(query);
    const totalPages = Math.ceil(totalFollowUps / limit);

    res.json({
      success: true,
      data: followUps,
      pagination: {
        currentPage: page,
        totalPages,
        totalFollowUps,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-ups',
      error: error.message
    });
  }
});

// PUT /api/mobile/followups/:id - Update follow-up status
router.put('/followups/:id', async (req, res) => {
  try {
    const followUpId = req.params.id;
    const updateData = req.body;

    const followUp = await FollowUp.findByIdAndUpdate(
      followUpId,
      updateData,
      { new: true, runValidators: true }
    ).populate('leadId', 'name email phone company');

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    // Update lead status if follow-up is completed
    if (updateData.status === 'completed') {
      await Lead.findByIdAndUpdate(followUp.leadId._id, {
        status: 'contacted',
        lastContact: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Follow-up updated successfully',
      data: followUp
    });

  } catch (error) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update follow-up',
      error: error.message
    });
  }
});

// ==================== EMPLOYEE DASHBOARD APIs ====================

// GET /api/mobile/employee/:id/dashboard - Get employee dashboard data
router.get('/employee/:id/dashboard', async (req, res) => {
  try {
    const employeeId = req.params.id;

    // Get employee assigned leads
    const assignedLeads = await Lead.find({ assignedTo: employeeId })
      .populate('followUps')
      .sort({ createdAt: -1 });

    // Get employee follow-ups
    const followUps = await FollowUp.find({ assignedTo: employeeId })
      .populate('leadId', 'name email phone company')
      .sort({ nextFollowUpDate: 1 });

    // Calculate statistics
    const stats = {
      totalLeads: assignedLeads.length,
      newLeads: assignedLeads.filter(lead => lead.status === 'new').length,
      contactedLeads: assignedLeads.filter(lead => lead.status === 'contacted').length,
      convertedLeads: assignedLeads.filter(lead => lead.status === 'converted').length,
      pendingFollowUps: followUps.filter(f => f.status === 'pending').length,
      completedFollowUps: followUps.filter(f => f.status === 'completed').length,
      overdueFollowUps: followUps.filter(f => 
        f.status === 'pending' && 
        f.nextFollowUpDate && 
        new Date(f.nextFollowUpDate) < new Date()
      ).length
    };

    // Get today's follow-ups
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFollowUps = followUps.filter(f => 
      f.nextFollowUpDate && 
      new Date(f.nextFollowUpDate) >= today && 
      new Date(f.nextFollowUpDate) < tomorrow
    );

    res.json({
      success: true,
      data: {
        stats,
        assignedLeads: assignedLeads.slice(0, 10), // Latest 10 leads
        followUps: followUps.slice(0, 10), // Next 10 follow-ups
        todayFollowUps
      }
    });

  } catch (error) {
    console.error('Error fetching employee dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee dashboard data',
      error: error.message
    });
  }
});

// ==================== ADMIN DASHBOARD APIs ====================

// GET /api/mobile/admin/dashboard - Get admin dashboard data
router.get('/admin/dashboard', async (req, res) => {
  try {
    // Get all leads
    const allLeads = await Lead.find()
      .populate('assignedTo', 'name email')
      .populate('followUps')
      .sort({ createdAt: -1 });

    // Get all follow-ups
    const allFollowUps = await FollowUp.find()
      .populate('leadId', 'name email phone company')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    // Get all employees
    const employees = await Employee.find({ status: 'active' })
      .select('name email phone department');

    // Calculate overall statistics
    const stats = {
      totalLeads: allLeads.length,
      newLeads: allLeads.filter(lead => lead.status === 'new').length,
      assignedLeads: allLeads.filter(lead => lead.status === 'assigned').length,
      contactedLeads: allLeads.filter(lead => lead.status === 'contacted').length,
      convertedLeads: allLeads.filter(lead => lead.status === 'converted').length,
      totalFollowUps: allFollowUps.length,
      pendingFollowUps: allFollowUps.filter(f => f.status === 'pending').length,
      completedFollowUps: allFollowUps.filter(f => f.status === 'completed').length,
      totalEmployees: employees.length
    };

    // Employee performance data
    const employeePerformance = employees.map(emp => {
      const empLeads = allLeads.filter(lead => 
        lead.assignedTo && lead.assignedTo._id.toString() === emp._id.toString()
      );
      const empFollowUps = allFollowUps.filter(f => 
        f.assignedTo && f.assignedTo._id.toString() === emp._id.toString()
      );

      return {
        employee: emp,
        assignedLeads: empLeads.length,
        convertedLeads: empLeads.filter(lead => lead.status === 'converted').length,
        totalFollowUps: empFollowUps.length,
        completedFollowUps: empFollowUps.filter(f => f.status === 'completed').length,
        conversionRate: empLeads.length > 0 ? 
          ((empLeads.filter(lead => lead.status === 'converted').length / empLeads.length) * 100).toFixed(2) : 0
      };
    });

    // Recent activities (latest follow-ups completed by employees)
    const recentActivities = allFollowUps
      .filter(f => f.status === 'completed')
      .slice(0, 20)
      .map(f => ({
        id: f._id,
        type: 'follow_up_completed',
        employee: f.assignedTo,
        lead: f.leadId,
        notes: f.notes,
        completedAt: f.updatedAt || f.createdAt
      }));

    res.json({
      success: true,
      data: {
        stats,
        employeePerformance,
        recentActivities,
        recentLeads: allLeads.slice(0, 10),
        upcomingFollowUps: allFollowUps
          .filter(f => f.status === 'pending' && f.nextFollowUpDate)
          .sort((a, b) => new Date(a.nextFollowUpDate) - new Date(b.nextFollowUpDate))
          .slice(0, 10)
      }
    });

  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard data',
      error: error.message
    });
  }
});

// GET /api/mobile/admin/employee-followups - Get all follow-ups done by employees
router.get('/admin/employee-followups', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Filter by employee
    if (req.query.employeeId) {
      query.assignedTo = req.query.employeeId;
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const followUps = await FollowUp.find(query)
      .populate('leadId', 'name email phone company status')
      .populate('assignedTo', 'name email department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalFollowUps = await FollowUp.countDocuments(query);
    const totalPages = Math.ceil(totalFollowUps / limit);

    res.json({
      success: true,
      data: followUps,
      pagination: {
        currentPage: page,
        totalPages,
        totalFollowUps,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching employee follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee follow-ups',
      error: error.message
    });
  }
});

module.exports = router;
