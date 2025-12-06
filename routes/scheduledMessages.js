const express = require('express');
const router = express.Router();
const ScheduledMessage = require('../models/ScheduledMessage');
const Lead = require('../models/Lead');
const MessageTemplate = require('../models/MessageTemplate');
const AutoFollowUpRule = require('../models/AutoFollowUpRule');

// GET /api/scheduled-messages - Get all scheduled messages
router.get('/', async (req, res) => {
  try {
    const { status, leadId, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (leadId) query.leadId = leadId;
    
    const skip = (page - 1) * limit;
    
    const messages = await ScheduledMessage.find(query)
      .populate('leadId', 'name company phone email')
      .populate('templateId', 'name title category')
      .populate('ruleId', 'name description')
      .sort({ scheduledFor: 1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await ScheduledMessage.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Scheduled messages retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled messages'
    });
  }
});

// POST /api/scheduled-messages - Create manual scheduled message
router.post('/', async (req, res) => {
  try {
    const {
      leadId,
      templateId,
      customMessage,
      scheduledFor,
      priority,
      createdBy
    } = req.body;

    // Validation
    if (!leadId || !scheduledFor || (!templateId && !customMessage)) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID, scheduled time, and either template ID or custom message are required'
      });
    }

    // Get lead details
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (!lead.phone) {
      return res.status(400).json({
        success: false,
        message: 'Lead does not have a phone number'
      });
    }

    let messageContent = customMessage;
    
    // If template is provided, generate content from template
    if (templateId) {
      const template = await MessageTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Message template not found'
        });
      }
      
      messageContent = await generateMessageContent(template, lead);
    }

    const scheduledMessage = new ScheduledMessage({
      leadId,
      templateId,
      phoneNumber: formatPhoneNumber(lead.phone),
      message: messageContent,
      scheduledFor: new Date(scheduledFor),
      priority: priority || 'medium',
      messageType: 'manual',
      createdBy
    });

    await scheduledMessage.save();
    
    // Populate for response
    await scheduledMessage.populate([
      { path: 'leadId', select: 'name company phone email' },
      { path: 'templateId', select: 'name title category' }
    ]);

    res.status(201).json({
      success: true,
      data: scheduledMessage,
      message: 'Message scheduled successfully'
    });
  } catch (error) {
    console.error('Error creating scheduled message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule message'
    });
  }
});

// PUT /api/scheduled-messages/:id - Update scheduled message
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledFor, message, priority, status } = req.body;

    const scheduledMessage = await ScheduledMessage.findById(id);
    if (!scheduledMessage) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled message not found'
      });
    }

    // Only allow updates if message is still pending
    if (scheduledMessage.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only update pending messages'
      });
    }

    const updateData = {};
    if (scheduledFor) updateData.scheduledFor = new Date(scheduledFor);
    if (message) updateData.message = message;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;
    updateData.updatedAt = Date.now();

    const updatedMessage = await ScheduledMessage.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'leadId', select: 'name company phone email' },
      { path: 'templateId', select: 'name title category' }
    ]);

    res.json({
      success: true,
      data: updatedMessage,
      message: 'Scheduled message updated successfully'
    });
  } catch (error) {
    console.error('Error updating scheduled message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheduled message'
    });
  }
});

// DELETE /api/scheduled-messages/:id - Cancel scheduled message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const scheduledMessage = await ScheduledMessage.findById(id);
    if (!scheduledMessage) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled message not found'
      });
    }

    // Only allow cancellation if message is still pending
    if (scheduledMessage.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending messages'
      });
    }

    scheduledMessage.status = 'cancelled';
    scheduledMessage.updatedAt = Date.now();
    await scheduledMessage.save();

    res.json({
      success: true,
      message: 'Scheduled message cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel scheduled message'
    });
  }
});

// GET /api/scheduled-messages/stats - Get scheduling statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      ScheduledMessage.countDocuments({ status: 'pending' }),
      ScheduledMessage.countDocuments({ status: 'sent' }),
      ScheduledMessage.countDocuments({ status: 'failed' }),
      ScheduledMessage.countDocuments({ 
        status: 'pending', 
        scheduledFor: { $lte: new Date() } 
      }), // Overdue
      ScheduledMessage.countDocuments({
        status: 'pending',
        scheduledFor: { 
          $gte: new Date(),
          $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) 
        }
      }) // Next 24 hours
    ]);

    const [pending, sent, failed, overdue, next24Hours] = stats;

    // Get recent activity
    const recentMessages = await ScheduledMessage.find()
      .populate('leadId', 'name company')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          pending,
          sent,
          failed,
          overdue,
          next24Hours,
          total: pending + sent + failed
        },
        recentActivity: recentMessages
      },
      message: 'Statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching message statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// POST /api/scheduled-messages/send-now/:id - Send message immediately
router.post('/send-now/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const scheduledMessage = await ScheduledMessage.findById(id)
      .populate('leadId', 'name company phone email');

    if (!scheduledMessage) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled message not found'
      });
    }

    if (scheduledMessage.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Message is not in pending status'
      });
    }

    // Attempt to send the message
    try {
      // Here you would integrate with actual WhatsApp API
      console.log(`📱 Sending WhatsApp message immediately to ${scheduledMessage.phoneNumber}`);
      console.log(`Message: ${scheduledMessage.message}`);
      console.log(`Lead: ${scheduledMessage.leadId?.name}`);

      // Update message status
      scheduledMessage.status = 'sent';
      scheduledMessage.sentAt = new Date();
      scheduledMessage.attempts += 1;
      scheduledMessage.lastAttemptAt = new Date();
      await scheduledMessage.save();

      res.json({
        success: true,
        data: scheduledMessage,
        message: 'Message sent successfully'
      });
    } catch (sendError) {
      console.error('Failed to send message:', sendError);
      
      scheduledMessage.status = 'failed';
      scheduledMessage.failureReason = sendError.message;
      scheduledMessage.attempts += 1;
      scheduledMessage.lastAttemptAt = new Date();
      await scheduledMessage.save();

      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: sendError.message
      });
    }
  } catch (error) {
    console.error('Error sending message immediately:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process immediate send request'
    });
  }
});

// Helper functions
async function generateMessageContent(template, lead) {
  let content = template.content;
  
  // Replace common variables
  const variables = {
    name: lead.name || 'Customer',
    company: lead.company || 'your company',
    service: lead.title || 'our services',
    phone: lead.phone || '',
    email: lead.email || '',
    budget: lead.budget || 'your budget',
    source: lead.source || 'website'
  };
  
  // Replace all variables in the content
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    content = content.replace(regex, variables[key]);
  });
  
  return content;
}

function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned; // Add India country code
  }
  
  return cleaned;
}

module.exports = router;
