const express = require('express');
const router = express.Router();
const AutoFollowUpRule = require('../models/AutoFollowUpRule');
const MessageTemplate = require('../models/MessageTemplate');
const ScheduledMessage = require('../models/ScheduledMessage');
const Lead = require('../models/Lead');

// GET /api/auto-follow-up-rules - Get all auto follow-up rules
router.get('/', async (req, res) => {
  try {
    const rules = await AutoFollowUpRule.find({ active: true })
      .populate('messageTemplate', 'name title content category')
      .sort({ priority: -1, createdAt: -1 });
    
    res.json({
      success: true,
      data: rules,
      message: 'Auto follow-up rules retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching auto follow-up rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auto follow-up rules'
    });
  }
});

// POST /api/auto-follow-up-rules - Create new auto follow-up rule
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      triggerCondition,
      messageTemplate,
      scheduleDelay,
      priority,
      maxExecutions,
      createdBy
    } = req.body;

    // Validation
    if (!name || !messageTemplate || !scheduleDelay) {
      return res.status(400).json({
        success: false,
        message: 'Name, message template, and schedule delay are required'
      });
    }

    // Verify message template exists
    const template = await MessageTemplate.findById(messageTemplate);
    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'Message template not found'
      });
    }

    const rule = new AutoFollowUpRule({
      name,
      description,
      triggerCondition,
      messageTemplate,
      scheduleDelay,
      priority: priority || 'medium',
      maxExecutions: maxExecutions || 1,
      createdBy
    });

    await rule.save();

    // Populate the template for response
    await rule.populate('messageTemplate', 'name title content category');

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Auto follow-up rule created successfully'
    });
  } catch (error) {
    console.error('Error creating auto follow-up rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create auto follow-up rule'
    });
  }
});

// PUT /api/auto-follow-up-rules/:id - Update auto follow-up rule
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const rule = await AutoFollowUpRule.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('messageTemplate', 'name title content category');

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Auto follow-up rule not found'
      });
    }

    res.json({
      success: true,
      data: rule,
      message: 'Auto follow-up rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating auto follow-up rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auto follow-up rule'
    });
  }
});

// DELETE /api/auto-follow-up-rules/:id - Delete auto follow-up rule
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await AutoFollowUpRule.findByIdAndUpdate(
      id,
      { active: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Auto follow-up rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Auto follow-up rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting auto follow-up rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete auto follow-up rule'
    });
  }
});

// POST /api/auto-follow-up-rules/execute - Execute rules for leads (manual trigger)
router.post('/execute', async (req, res) => {
  try {
    const { leadIds } = req.body; // Optional: specific lead IDs, otherwise all leads
    
    const rules = await AutoFollowUpRule.find({ active: true })
      .populate('messageTemplate', 'name title content variables');
    
    if (rules.length === 0) {
      return res.json({
        success: true,
        data: { scheduledCount: 0 },
        message: 'No active rules found'
      });
    }

    // Get leads to process
    const leadQuery = leadIds ? { _id: { $in: leadIds } } : {};
    const leads = await Lead.find(leadQuery);
    
    let scheduledCount = 0;
    
    for (const rule of rules) {
      for (const lead of leads) {
        // Check if rule conditions match the lead
        if (await checkRuleConditions(rule, lead)) {
          // Check if rule hasn't been executed too many times for this lead
          const executionCount = await ScheduledMessage.countDocuments({
            leadId: lead._id,
            ruleId: rule._id
          });
          
          if (executionCount < rule.maxExecutions) {
            // Calculate schedule time
            const scheduleTime = calculateScheduleTime(rule.scheduleDelay);
            
            // Generate message content with variables
            const messageContent = await generateMessageContent(rule.messageTemplate, lead);
            
            // Create scheduled message
            const scheduledMessage = new ScheduledMessage({
              leadId: lead._id,
              ruleId: rule._id,
              templateId: rule.messageTemplate._id,
              phoneNumber: formatPhoneNumber(lead.phone),
              message: messageContent,
              scheduledFor: scheduleTime,
              priority: rule.priority,
              messageType: 'auto_follow_up'
            });
            
            await scheduledMessage.save();
            scheduledCount++;
          }
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        rulesProcessed: rules.length,
        leadsProcessed: leads.length,
        scheduledCount
      },
      message: `Scheduled ${scheduledCount} follow-up messages`
    });
  } catch (error) {
    console.error('Error executing auto follow-up rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute auto follow-up rules'
    });
  }
});

// Helper functions
async function checkRuleConditions(rule, lead) {
  const conditions = rule.triggerCondition;
  
  // Check lead status
  if (conditions.leadStatus && conditions.leadStatus.length > 0) {
    if (!conditions.leadStatus.includes(lead.status)) {
      return false;
    }
  }
  
  // Check lead source
  if (conditions.leadSource && conditions.leadSource.length > 0) {
    if (!conditions.leadSource.includes(lead.source)) {
      return false;
    }
  }
  
  // Check days since created
  if (conditions.daysSinceCreated) {
    const daysSinceCreated = Math.floor((Date.now() - lead.createdAt) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated < conditions.daysSinceCreated) {
      return false;
    }
  }
  
  // Check days since last contact
  if (conditions.daysSinceLastContact) {
    const lastContact = lead.lastContact || lead.createdAt;
    const daysSinceLastContact = Math.floor((Date.now() - lastContact) / (1000 * 60 * 60 * 24));
    if (daysSinceLastContact < conditions.daysSinceLastContact) {
      return false;
    }
  }
  
  // Check lead value range
  if (conditions.leadValue) {
    const leadValue = lead.value || 0;
    if (conditions.leadValue.min && leadValue < conditions.leadValue.min) {
      return false;
    }
    if (conditions.leadValue.max && leadValue > conditions.leadValue.max) {
      return false;
    }
  }
  
  return true;
}

function calculateScheduleTime(scheduleDelay) {
  const now = new Date();
  const { value, unit } = scheduleDelay;
  
  switch (unit) {
    case 'minutes':
      return new Date(now.getTime() + (value * 60 * 1000));
    case 'hours':
      return new Date(now.getTime() + (value * 60 * 60 * 1000));
    case 'days':
      return new Date(now.getTime() + (value * 24 * 60 * 60 * 1000));
    default:
      return new Date(now.getTime() + (value * 60 * 60 * 1000)); // Default to hours
  }
}

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
