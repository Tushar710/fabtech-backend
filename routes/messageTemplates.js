const express = require('express');
const router = express.Router();
const MessageTemplate = require('../models/MessageTemplate');

// GET /api/message-templates - Get all message templates
router.get('/', async (req, res) => {
  try {
    const templates = await MessageTemplate.find({ isActive: true })
      .sort({ category: 1, name: 1 });
    
    res.json({
      success: true,
      data: templates,
      message: 'Message templates retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching message templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message templates'
    });
  }
});

// POST /api/message-templates - Create new message template
router.post('/', async (req, res) => {
  try {
    const {
      name,
      title,
      content,
      variables,
      category,
      createdBy
    } = req.body;

    // Validation
    if (!name || !content) {
      return res.status(400).json({
        success: false,
        message: 'Name and content are required'
      });
    }

    // Check if template name already exists
    const existingTemplate = await MessageTemplate.findOne({ name });
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Template name already exists'
      });
    }

    const template = new MessageTemplate({
      name,
      content,
      variables: variables || [],
      category: category || 'follow-up',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      description: req.body.description || ''
    });

    await template.save();

    res.status(201).json({
      success: true,
      data: template,
      message: 'Message template created successfully'
    });
  } catch (error) {
    console.error('Error creating message template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create message template'
    });
  }
});

// PUT /api/message-templates/:id - Update message template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const template = await MessageTemplate.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Message template not found'
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Message template updated successfully'
    });
  } catch (error) {
    console.error('Error updating message template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message template'
    });
  }
});

// DELETE /api/message-templates/:id - Delete message template (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await MessageTemplate.findByIdAndUpdate(
      id,
      { active: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Message template not found'
      });
    }

    res.json({
      success: true,
      message: 'Message template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message template'
    });
  }
});

// POST /api/message-templates/preview - Preview message with variables
router.post('/preview', async (req, res) => {
  try {
    const { templateId, variables } = req.body;

    const template = await MessageTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    let previewMessage = template.content;
    
    // Replace variables in the message
    if (variables) {
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'g');
        previewMessage = previewMessage.replace(regex, variables[key] || '');
      });
    }

    res.json({
      success: true,
      data: {
        originalContent: template.content,
        previewContent: previewMessage,
        variables: template.variables
      },
      message: 'Message preview generated successfully'
    });
  } catch (error) {
    console.error('Error generating message preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate message preview'
    });
  }
});

module.exports = router;
