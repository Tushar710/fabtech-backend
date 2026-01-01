const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const auth = require('../middleware/auth');

// Get all reminders for company
router.get('/', auth, async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    
    const reminders = await Reminder.find({ companyId })
      .sort({ reminderDate: 1 });
    
    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminders',
      error: error.message
    });
  }
});

// Get reminders for specific user
router.get('/my-reminders', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const reminders = await Reminder.find({ createdBy: userId })
      .sort({ reminderDate: 1 });
    
    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminders',
      error: error.message
    });
  }
});

// Create new reminder
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, reminderDate, priority } = req.body;

    
    if (!title || !reminderDate) {
      return res.status(400).json({
        success: false,
        message: 'Title and reminder date are required'
      });
    }

    const companyId = req.user.companyId || req.user.company;
    const creatorName = req.user.teamMemberName || req.user.name || req.user.email;
    
    const reminder = new Reminder({
      title,
      description,
      reminderDate,
      priority: priority || 'medium',
      companyId,
      createdBy: req.user.id || req.user._id,
      createdByModel: req.user.role === 'employee' ? 'Employee' : 'User',
      createdByName: creatorName
    });

    await reminder.save();

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reminder',
      error: error.message
    });
  }
});

// Mark reminder as notified
router.patch('/:id/notified', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    reminder.notified = true;
    reminder.notifiedAt = new Date();
    await reminder.save();

    res.json({
      success: true,
      message: 'Reminder marked as notified',
      data: reminder
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reminder',
      error: error.message
    });
  }
});

// Mark reminder as completed
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    reminder.completed = true;
    reminder.completedAt = new Date();
    await reminder.save();

    res.json({
      success: true,
      message: 'Reminder marked as completed',
      data: reminder
    });
  } catch (error) {
    console.error('Error completing reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete reminder',
      error: error.message
    });
  }
});

// Delete reminder
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const reminder = await Reminder.findByIdAndDelete(id);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    res.json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reminder',
      error: error.message
    });
  }
});

module.exports = router;
