const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const { validationResult, body } = require('express-validator');
const mongoose = require('mongoose');

// Add follow-up to a lead (can be used by both admin and employee)
router.post('/add/:leadId', [
  body('type').isIn(['call', 'email', 'meeting', 'demo', 'proposal', 'message', 'other']).withMessage('Invalid follow-up type'),
  body('summary').notEmpty().withMessage('Summary is required'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes too long'),
  body('nextFollowUpDate').optional().isISO8601().withMessage('Invalid next follow-up date')
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

    const { leadId } = req.params;
    const { type, summary, notes, nextFollowUpDate, nextStep } = req.body;
    const userId = req.user?.id || req.body.userId; // Support both authenticated and manual user ID

    console.log('📝 Adding follow-up to lead:', leadId);

    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Get user info (could be admin or employee)
    let userInfo = { name: 'System', role: 'system' };
    if (userId) {
      // Try to find in employees collection first
      const db = mongoose.connection.db;
      const employee = await db.collection('employees').findOne({ 
        _id: new mongoose.Types.ObjectId(userId)
      });
      
      if (employee) {
        userInfo = {
          name: employee.teamMemberName || employee.name || 'Employee',
          role: employee.role || 'Employee',
          email: employee.teamMemberEmail || employee.email
        };
      }
    }

    // Create follow-up object
    const followUp = {
      type,
      summary,
      notes: notes || '',
      date: new Date(),
      nextStep: nextStep || '',
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      priority: req.body.priority || 'medium',
      completed: false,
      addedBy: userId || null,
      addedByName: userInfo.name,
      addedByRole: userInfo.role,
      addedByEmail: userInfo.email || ''
    };

    // Add follow-up to lead
    lead.followUps.push(followUp);
    
    // Update next follow-up date if provided
    if (nextFollowUpDate) {
      lead.nextFollowUp = new Date(nextFollowUpDate);
    }

    // Update last contact date
    lead.lastContact = new Date();

    await lead.save();

    console.log('✅ Follow-up added successfully');

    res.json({
      success: true,
      message: 'Follow-up added successfully',
      data: {
        followUp: followUp,
        leadId: leadId,
        addedBy: userInfo.name
      }
    });

  } catch (error) {
    console.error('❌ Error adding follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add follow-up',
      error: error.message
    });
  }
});

// Get all follow-ups for a lead
router.get('/lead/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Sort follow-ups by date (newest first)
    const followUps = lead.followUps.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        leadInfo: {
          id: lead._id,
          name: lead.customerName || lead.name,
          email: lead.email,
          phone: lead.phone || lead.contactNumber,
          company: lead.customerCompany || lead.company
        },
        followUps: followUps
      }
    });

  } catch (error) {
    console.error('❌ Error fetching follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-ups',
      error: error.message
    });
  }
});

// Update follow-up status (mark as completed)
router.put('/update/:leadId/:followUpId', async (req, res) => {
  try {
    const { leadId, followUpId } = req.params;
    const { completed, notes } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const followUp = lead.followUps.id(followUpId);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    // Update follow-up
    followUp.completed = completed !== undefined ? completed : followUp.completed;
    if (notes) {
      followUp.notes = notes;
    }

    await lead.save();

    res.json({
      success: true,
      message: 'Follow-up updated successfully',
      data: followUp
    });

  } catch (error) {
    console.error('❌ Error updating follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update follow-up',
      error: error.message
    });
  }
});

// Get upcoming follow-ups (for dashboard)
router.get('/upcoming/:userId?', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query; // Default to next 7 days

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + parseInt(days));

    let query = {
      nextFollowUp: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // If userId provided, filter by assigned leads
    if (userId) {
      query.assignedTo = userId;
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'teamMemberName role')
      .sort({ nextFollowUp: 1 });

    console.log('📊 Found leads for upcoming follow-ups:', leads.length);
    if (leads.length > 0) {
      console.log('📝 Sample lead data:', {
        customerName: leads[0].customerName,
        name: leads[0].name,
        customerCompany: leads[0].customerCompany,
        company: leads[0].company,
        email: leads[0].email
      });
    }

    // Get the latest follow-up for each lead
    const upcomingFollowUps = leads.map(lead => {
      const latestFollowUp = lead.followUps
        .filter(f => !f.completed && f.nextFollowUpDate)
        .sort((a, b) => new Date(a.nextFollowUpDate) - new Date(b.nextFollowUpDate))[0];

      // Handle both old and new field names
      const leadName = lead.customerName || lead.name || 'Unknown Lead';
      const leadCompany = lead.customerCompany || lead.company || '';
      const leadPhone = lead.phone || lead.contactNumber || '';

      return {
        leadId: lead._id,
        leadName: leadName,
        leadEmail: lead.email || '',
        leadPhone: leadPhone,
        leadCompany: leadCompany,
        nextFollowUpDate: lead.nextFollowUp,
        scheduledDate: latestFollowUp?.nextFollowUpDate || lead.nextFollowUp,
        type: latestFollowUp?.type || 'call',
        priority: latestFollowUp?.priority || 'medium',
        notes: latestFollowUp?.summary || latestFollowUp?.notes || '',
        summary: latestFollowUp?.summary || '',
        assignedTo: lead.assignedTo,
        assignedEmployee: lead.assignedTo?.teamMemberName || '',
        followUpDetails: latestFollowUp || null
      };
    });

    res.json({
      success: true,
      data: upcomingFollowUps,
      count: upcomingFollowUps.length
    });

  } catch (error) {
    console.error('❌ Error fetching upcoming follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming follow-ups',
      error: error.message
    });
  }
});

// Get overdue follow-ups
router.get('/overdue/:userId?', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = {
      nextFollowUp: {
        $lt: today
      }
    };

    // If userId provided, filter by assigned leads
    if (userId) {
      query.assignedTo = userId;
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'teamMemberName role')
      .sort({ nextFollowUp: 1 });

    console.log('🚨 Found overdue leads:', leads.length);
    if (leads.length > 0) {
      console.log('📝 Sample overdue lead data:', {
        customerName: leads[0].customerName,
        name: leads[0].name,
        customerCompany: leads[0].customerCompany,
        company: leads[0].company,
        email: leads[0].email
      });
    }

    const overdueFollowUps = leads.map(lead => {
      const daysOverdue = Math.floor((today - new Date(lead.nextFollowUp)) / (1000 * 60 * 60 * 24));
      const latestFollowUp = lead.followUps
        .filter(f => !f.completed && f.nextFollowUpDate)
        .sort((a, b) => new Date(a.nextFollowUpDate) - new Date(b.nextFollowUpDate))[0];
      
      // Handle both old and new field names
      const leadName = lead.customerName || lead.name || 'Unknown Lead';
      const leadCompany = lead.customerCompany || lead.company || '';
      const leadPhone = lead.phone || lead.contactNumber || '';
      
      return {
        leadId: lead._id,
        leadName: leadName,
        leadEmail: lead.email || '',
        leadPhone: leadPhone,
        leadCompany: leadCompany,
        nextFollowUpDate: lead.nextFollowUp,
        scheduledDate: latestFollowUp?.nextFollowUpDate || lead.nextFollowUp,
        type: latestFollowUp?.type || 'call',
        priority: latestFollowUp?.priority || 'medium',
        notes: latestFollowUp?.summary || latestFollowUp?.notes || '',
        summary: latestFollowUp?.summary || '',
        daysOverdue: daysOverdue,
        assignedTo: lead.assignedTo,
        assignedEmployee: lead.assignedTo?.teamMemberName || ''
      };
    });

    res.json({
      success: true,
      data: overdueFollowUps,
      count: overdueFollowUps.length
    });

  } catch (error) {
    console.error('❌ Error fetching overdue follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue follow-ups',
      error: error.message
    });
  }
});

// Reschedule follow-up
router.put('/reschedule/:leadId/:followUpId', async (req, res) => {
  try {
    const { leadId, followUpId } = req.params;
    const { newDate, reason } = req.body;

    if (!newDate) {
      return res.status(400).json({
        success: false,
        message: 'New date is required'
      });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const followUp = lead.followUps.id(followUpId);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    // Store previous date in history
    const previousDate = followUp.nextFollowUpDate || followUp.date;
    
    if (!followUp.rescheduleHistory) {
      followUp.rescheduleHistory = [];
    }
    
    followUp.rescheduleHistory.push({
      previousDate: previousDate,
      newDate: new Date(newDate),
      reason: reason || 'Rescheduled',
      rescheduledAt: new Date(),
      rescheduledBy: req.user?.name || 'User'
    });

    // Update follow-up
    followUp.nextFollowUpDate = new Date(newDate);
    followUp.rescheduleCount = (followUp.rescheduleCount || 0) + 1;
    followUp.status = 'rescheduled';

    // Update lead's next follow-up date
    lead.nextFollowUp = new Date(newDate);

    await lead.save();

    console.log('🔄 Follow-up rescheduled:', {
      leadId,
      followUpId,
      previousDate,
      newDate,
      rescheduleCount: followUp.rescheduleCount
    });

    res.json({
      success: true,
      message: 'Follow-up rescheduled successfully',
      data: {
        followUp: followUp,
        rescheduleCount: followUp.rescheduleCount,
        newDate: new Date(newDate)
      }
    });

  } catch (error) {
    console.error('❌ Error rescheduling follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule follow-up',
      error: error.message
    });
  }
});

// Complete follow-up
router.put('/complete/:leadId/:followUpId', async (req, res) => {
  try {
    const { leadId, followUpId } = req.params;
    const { outcome, notes } = req.body;

    console.log('✅ Complete follow-up request:', {
      leadId,
      followUpId,
      outcome,
      notes
    });

    const lead = await Lead.findById(leadId);
    if (!lead) {
      console.log('❌ Lead not found:', leadId);
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    console.log('📋 Lead found, follow-ups count:', lead.followUps.length);

    const followUp = lead.followUps.id(followUpId);
    if (!followUp) {
      console.log('❌ Follow-up not found:', followUpId);
      console.log('Available follow-up IDs:', lead.followUps.map(f => f._id.toString()));
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    console.log('📝 Follow-up before update:', {
      completed: followUp.completed,
      status: followUp.status,
      summary: followUp.summary
    });

    // Mark as completed
    followUp.completed = true;
    followUp.completedAt = new Date();
    followUp.status = 'completed';
    
    if (notes) {
      followUp.notes = (followUp.notes || '') + '\n\nCompletion Notes: ' + notes;
    }
    
    if (outcome) {
      followUp.outcome = outcome;
    }

    console.log('📝 Follow-up after update:', {
      completed: followUp.completed,
      status: followUp.status,
      completedAt: followUp.completedAt,
      outcome: followUp.outcome
    });

    // Update lead's next follow-up to the next pending one
    const nextPendingFollowUp = lead.followUps
      .filter(f => !f.completed && f.nextFollowUpDate && f._id.toString() !== followUpId)
      .sort((a, b) => new Date(a.nextFollowUpDate) - new Date(b.nextFollowUpDate))[0];
    
    if (nextPendingFollowUp) {
      lead.nextFollowUp = nextPendingFollowUp.nextFollowUpDate;
    } else {
      lead.nextFollowUp = null;
    }

    await lead.save();

    console.log('✅ Follow-up completed successfully:', {
      leadId,
      followUpId,
      completedAt: followUp.completedAt,
      status: followUp.status
    });

    res.json({
      success: true,
      message: 'Follow-up marked as completed',
      data: {
        followUp: followUp,
        nextFollowUp: lead.nextFollowUp
      }
    });

  } catch (error) {
    console.error('❌ Error completing follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete follow-up',
      error: error.message
    });
  }
});

// Delete follow-up
router.delete('/delete/:leadId/:followUpId', async (req, res) => {
  try {
    const { leadId, followUpId } = req.params;

    console.log('🗑️ Delete follow-up request:', {
      leadId,
      followUpId
    });

    const lead = await Lead.findById(leadId);
    if (!lead) {
      console.log('❌ Lead not found:', leadId);
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    console.log('📋 Lead found, follow-ups count:', lead.followUps.length);

    const followUp = lead.followUps.id(followUpId);
    if (!followUp) {
      console.log('❌ Follow-up not found:', followUpId);
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    console.log('🗑️ Removing follow-up from array');

    // Remove the follow-up using pull method
    lead.followUps.pull(followUpId);

    // Update lead's next follow-up to the next pending one
    const nextPendingFollowUp = lead.followUps
      .filter(f => !f.completed && f.nextFollowUpDate)
      .sort((a, b) => new Date(a.nextFollowUpDate) - new Date(b.nextFollowUpDate))[0];
    
    if (nextPendingFollowUp) {
      lead.nextFollowUp = nextPendingFollowUp.nextFollowUpDate;
    } else {
      lead.nextFollowUp = null;
    }

    await lead.save();

    console.log('✅ Follow-up deleted successfully:', {
      leadId,
      followUpId
    });

    res.json({
      success: true,
      message: 'Follow-up deleted successfully',
      data: {
        deletedFollowUpId: followUpId,
        nextFollowUp: lead.nextFollowUp
      }
    });

  } catch (error) {
    console.error('❌ Error deleting follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete follow-up',
      error: error.message
    });
  }
});

// Get follow-up statistics
router.get('/stats/:userId?', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let matchQuery = {};
    if (userId) {
      matchQuery.assignedTo = new mongoose.Types.ObjectId(userId);
    }

    const stats = await Lead.aggregate([
      { $match: matchQuery },
      {
        $project: {
          totalFollowUps: { $size: '$followUps' },
          completedFollowUps: {
            $size: {
              $filter: {
                input: '$followUps',
                cond: { $eq: ['$$this.completed', true] }
              }
            }
          },
          pendingFollowUps: {
            $size: {
              $filter: {
                input: '$followUps',
                cond: { $eq: ['$$this.completed', false] }
              }
            }
          },
          isOverdue: {
            $cond: {
              if: { $and: [{ $ne: ['$nextFollowUp', null] }, { $lt: ['$nextFollowUp', today] }] },
              then: 1,
              else: 0
            }
          },
          hasUpcoming: {
            $cond: {
              if: { $and: [{ $ne: ['$nextFollowUp', null] }, { $gte: ['$nextFollowUp', today] }] },
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          totalFollowUps: { $sum: '$totalFollowUps' },
          completedFollowUps: { $sum: '$completedFollowUps' },
          pendingFollowUps: { $sum: '$pendingFollowUps' },
          overdueLeads: { $sum: '$isOverdue' },
          upcomingLeads: { $sum: '$hasUpcoming' }
        }
      }
    ]);

    const result = stats[0] || {
      totalLeads: 0,
      totalFollowUps: 0,
      completedFollowUps: 0,
      pendingFollowUps: 0,
      overdueLeads: 0,
      upcomingLeads: 0
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error fetching follow-up stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-up statistics',
      error: error.message
    });
  }
});

module.exports = router;
