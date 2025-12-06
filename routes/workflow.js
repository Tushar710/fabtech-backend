const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');
const auth = require('../middleware/auth');

// GET /api/workflow - Get all workflows
router.get('/', auth, async (req, res) => {
  try {
    const workflows = await Workflow.find({ 
      userId: req.user.id, 
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ message: 'Server error while fetching workflows' });
  }
});

// POST /api/workflow - Create a new workflow
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, stages } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workflow name is required' });
    }

    const workflow = new Workflow({
      name,
      description,
      stages: stages || [
        { name: 'New', order: 1, color: '#FCD34D' },
        { name: 'Contacted', order: 2, color: '#60A5FA' },
        { name: 'Qualified', order: 3, color: '#34D399' },
        { name: 'Proposal', order: 4, color: '#A78BFA' },
        { name: 'Negotiation', order: 5, color: '#FB7185' },
        { name: 'Closed Won', order: 6, color: '#10B981' },
        { name: 'Closed Lost', order: 7, color: '#EF4444' }
      ],
      userId: req.user.id
    });

    await workflow.save();
    res.status(201).json({ message: 'Workflow created successfully', workflow });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ message: 'Server error while creating workflow' });
  }
});

module.exports = router;
