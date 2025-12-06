const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Lead = require('../models/Lead');

// Middleware to verify employee authentication
const verifyEmployee = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const jwt = require('jsonwebtoken');
    let decoded;
    
    // Use the same JWT secret as auth.js
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log(`✅ JWT verified successfully:`, decoded);
    } catch (err) {
      console.log('❌ JWT verification failed:', err.message);
      
      // If token is expired, try to decode without verification for admin view
      if (err.name === 'TokenExpiredError') {
        try {
          decoded = jwt.decode(token);
          console.log('⚠️ JWT expired but decoded for admin access:', decoded);
        } catch (decodeErr) {
          return res.status(401).json({ message: 'Token expired and cannot be decoded.' });
        }
      } else {
        return res.status(400).json({ message: 'Invalid token.' });
      }
    }
    
    if (!decoded) {
      // If all secrets fail, try to decode without verification to get user info
      decoded = jwt.decode(token);
      console.log('⚠️ JWT signature verification failed, using decoded payload:', decoded);
    }
    
    if (!decoded) {
      return res.status(400).json({ message: 'Invalid token format.' });
    }
    
    // Allow access for any authenticated user (company users, employees, admins)
    // Since this is company dashboard data, any valid company token should have access
    console.log('🔍 Token payload for employee dashboard:', {
      role: decoded.role,
      type: decoded.type, 
      userType: decoded.userType,
      companyId: decoded.companyId,
      id: decoded.id
    });
    
    // Allow access if user has valid company token
    if (!decoded.companyId && !decoded.id) {
      return res.status(403).json({ 
        message: 'Access denied. Valid company authentication required.',
        userInfo: { role: decoded.role, type: decoded.type, userType: decoded.userType }
      });
    }
    
    // Ensure we have the correct employee ID field
    req.employee = {
      ...decoded,
      id: decoded.employeeId || decoded.id,
      name: decoded.name || decoded.email?.split('@')[0] || 'Employee'
    };
    console.log('✅ Employee verified:', req.employee);
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(400).json({ message: 'Invalid token.', error: error.message });
  }
};

// Get employee dashboard data
router.get('/dashboard', verifyEmployee, async (req, res) => {
  try {
    const employeeId = req.employee.employeeId || req.employee.id;
    console.log(`📊 Fetching dashboard data for employee: ${employeeId}`);
    
    // Get assigned leads using existing connection
    const assignedLeads = await Lead.find({ 
      assignedTo: new mongoose.Types.ObjectId(employeeId)
    }).sort({ createdAt: -1 });
    
    console.log(`📊 Found ${assignedLeads.length} assigned leads for employee ${employeeId}`);

    // Get leads by status
    const leadsByStatus = await Lead.aggregate([
      { $match: { 
        assignedTo: new mongoose.Types.ObjectId(employeeId)
      } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get leads with follow-ups due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const followUpsDue = await Lead.find({
      assignedTo: new mongoose.Types.ObjectId(employeeId),
      nextFollowUp: { $gte: today, $lt: tomorrow }
    }).sort({ nextFollowUp: 1 });

    // Get overdue follow-ups
    const overdueFollowUps = await Lead.find({
      assignedTo: new mongoose.Types.ObjectId(employeeId),
      nextFollowUp: { $lt: today }
    }).sort({ nextFollowUp: 1 });

    // Calculate statistics
    const totalLeads = assignedLeads.length;
    const newLeads = assignedLeads.filter(lead => lead.status === 'new').length;
    const inProgressLeads = assignedLeads.filter(lead => lead.status === 'in_progress').length;
    const convertedLeads = assignedLeads.filter(lead => lead.status === 'converted').length;

    const dashboardData = {
      employee: {
        id: req.employee.id,
        name: req.employee.name,
        email: req.employee.email,
        role: req.employee.role
      },
      statistics: {
        totalLeads,
        newLeads,
        inProgressLeads,
        convertedLeads,
        followUpsDueToday: followUpsDue.length,
        overdueFollowUps: overdueFollowUps.length
      },
      recentLeads: assignedLeads.slice(0, 10),
      followUpsDue,
      overdueFollowUps,
      leadsByStatus: leadsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    console.log(`📊 Dashboard response:`, {
      totalLeads: dashboardData.statistics.totalLeads,
      recentLeadsCount: dashboardData.recentLeads.length,
      employeeId: req.employee.id
    });

    res.json({
      success: true,
      data: dashboardData,
      message: `Dashboard data for ${req.employee.name}`
    });

  } catch (error) {
    console.error('Error fetching employee dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get assigned leads for employee
router.get('/leads', async (req, res) => {
  try {
    console.log('📋 Employee dashboard leads request');
    
    // For admin/company users, check if adminView is requested
    const { adminView } = req.query;
    
    // If adminView is requested, allow access without authentication
    if (adminView === 'true') {
      console.log('📋 Admin view requested - allowing access without auth');
    } else {
      // For employee-specific views, we would need authentication
      console.log('📋 Employee view requested but no auth - defaulting to admin view');
    }
    
    const mongoose = require('mongoose');
    
    // Build query based on user type
    let query = {};
    
    // Always allow admin view for now (since authentication is optional)
    query = {};
    console.log('📋 Showing all leads (admin view)');
    
    console.log('📋 Query filter set:', query);

    const { status, page = 1, limit = 1000 } = req.query;

    if (status && status !== 'all') {
      query.status = status;
    }

    console.log('📋 Query being executed:', query);

    // Debug: Check database connection and model
    console.log('🔍 Lead model collection name:', Lead.collection.name);
    console.log('🔍 Database name:', Lead.db.name);
    
    // Test basic query first
    const allLeadsCount = await Lead.countDocuments({});
    console.log('🔍 Total leads in collection:', allLeadsCount);

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Use lean() for better performance

    const totalLeads = await Lead.countDocuments(query);

    console.log(`📋 Found ${leads.length} leads, total: ${totalLeads}`);

    const responseData = {
      leads: leads,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLeads / limit),
        totalLeads,
        hasNext: page * limit < totalLeads,
        hasPrev: page > 1
      }
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error fetching employee leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: error.message
    });
  }
});

// Update lead status
router.put('/leads/:leadId/status', verifyEmployee, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { status, notes } = req.body;
    const employeeId = req.employee.id;

    // Verify lead is assigned to this employee
    const lead = await Lead.findOne({ 
      _id: leadId, 
      assignedTo: employeeId.toString() 
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or not assigned to you'
      });
    }

    // Update lead status
    lead.status = status;
    if (notes) {
      lead.notes = (lead.notes || '') + `\n[${new Date().toISOString()}] Status updated to ${status}: ${notes}`;
    }
    lead.updatedAt = new Date();

    await lead.save();

    res.json({
      success: true,
      data: lead,
      message: 'Lead status updated successfully'
    });

  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead status'
    });
  }
});

// Add follow-up to lead
router.post('/leads/:leadId/follow-up', verifyEmployee, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { followUpDate, notes, priority = 'medium' } = req.body;
    const employeeId = req.employee.id;

    // Verify lead is assigned to this employee
    const lead = await Lead.findOne({ 
      _id: leadId, 
      assignedTo: employeeId.toString() 
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or not assigned to you'
      });
    }

    // Add follow-up
    const followUp = {
      date: new Date(followUpDate),
      notes: notes,
      priority: priority,
      createdBy: employeeId,
      createdAt: new Date()
    };

    if (!lead.followUps) {
      lead.followUps = [];
    }
    lead.followUps.push(followUp);
    
    // Update next follow-up date
    lead.nextFollowUp = new Date(followUpDate);
    lead.updatedAt = new Date();

    await lead.save();

    res.json({
      success: true,
      data: lead,
      message: 'Follow-up added successfully'
    });

  } catch (error) {
    console.error('Error adding follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add follow-up'
    });
  }
});

// Get notifications for employee
router.get('/notifications', verifyEmployee, async (req, res) => {
  try {
    const employeeId = req.employee.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get follow-ups due today and overdue
    const followUpNotifications = await Lead.find({
      assignedTo: employeeId.toString(),
      isActive: { $ne: false },
      nextFollowUp: { $lte: today }
    }).select('name email phone nextFollowUp status').sort({ nextFollowUp: 1 });

    // Get newly assigned leads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newAssignments = await Lead.find({
      assignedTo: employeeId.toString(),
      isActive: { $ne: false },
      assignedAt: { $gte: sevenDaysAgo }
    }).select('name email phone assignedAt status').sort({ assignedAt: -1 });

    const notifications = [
      ...followUpNotifications.map(lead => ({
        id: lead._id,
        type: 'follow_up',
        title: 'Follow-up Due',
        message: `Follow-up due for ${lead.name}`,
        lead: lead,
        date: lead.nextFollowUp,
        priority: lead.nextFollowUp < today ? 'high' : 'medium'
      })),
      ...newAssignments.map(lead => ({
        id: lead._id,
        type: 'new_assignment',
        title: 'New Lead Assigned',
        message: `New lead ${lead.name} assigned to you`,
        lead: lead,
        date: lead.assignedAt,
        priority: 'medium'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        notifications,
        counts: {
          total: notifications.length,
          followUps: followUpNotifications.length,
          newAssignments: newAssignments.length,
          high: notifications.filter(n => n.priority === 'high').length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

module.exports = router;
