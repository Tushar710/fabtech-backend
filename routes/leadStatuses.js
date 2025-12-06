const express = require('express');
const router = express.Router();
const LeadStatus = require('../models/LeadStatus');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// GET /api/lead-statuses - Get all lead statuses for company
router.get('/', auth, async (req, res) => {
  try {
    const companyId = req.companyId;
    
    console.log('🔍 LeadStatuses GET - Company ID:', companyId);
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch lead statuses'
      });
    }
    
    const statuses = await LeadStatus.find({ 
      companyId: companyId,
      isActive: true 
    }).sort({ order: 1, createdAt: 1 });
    
    console.log('🔍 LeadStatuses GET - Found statuses:', statuses.length);
    
    res.json({
      success: true,
      statuses
    });
  } catch (error) {
    console.error('Error fetching lead statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lead statuses'
    });
  }
});

// POST /api/lead-statuses - Create new lead status
router.post('/', auth, async (req, res) => {
  try {
    const companyId = req.companyId;
    
    console.log('🔍 LeadStatuses POST - Company ID:', companyId);
    console.log('🔍 LeadStatuses POST - Request body:', req.body);
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to create lead status'
      });
    }
    
    const {
      name,
      label,
      color,
      description,
      order,
      canTransitionTo,
      autoActions
    } = req.body;

    // Validation
    if (!name || !label) {
      return res.status(400).json({
        success: false,
        message: 'Name and label are required'
      });
    }

    // Check if status name already exists for this company
    const existingStatus = await LeadStatus.findOne({ 
      name: name.toLowerCase().replace(/\s+/g, '_'),
      companyId: companyId 
    });

    if (existingStatus) {
      return res.status(400).json({
        success: false,
        message: 'Status name already exists for your company'
      });
    }

    const leadStatus = new LeadStatus({
      name: name.toLowerCase().replace(/\s+/g, '_'),
      label,
      color: color || 'blue',
      description: description || '',
      order: order || 0,
      canTransitionTo: canTransitionTo || [],
      autoActions: autoActions || {},
      companyId: new mongoose.Types.ObjectId(companyId)
    });
    
    console.log('🔍 LeadStatuses POST - Creating status with companyId:', companyId);

    await leadStatus.save();

    res.status(201).json({
      success: true,
      message: 'Lead status created successfully',
      status: leadStatus
    });
  } catch (error) {
    console.error('Error creating lead status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating lead status' 
    });
  }
});

// PUT /api/lead-statuses/:id - Update lead status
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const companyId = req.companyId;

    console.log('🔍 LeadStatuses PUT - Status ID:', id);
    console.log('🔍 LeadStatuses PUT - Company ID:', companyId);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to update lead status'
      });
    }

    const leadStatus = await LeadStatus.findOneAndUpdate(
      { _id: id, companyId: companyId },
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!leadStatus) {
      return res.status(404).json({
        success: false,
        message: 'Lead status not found or does not belong to your company'
      });
    }

    res.json({
      success: true,
      message: 'Lead status updated successfully',
      status: leadStatus
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating lead status' 
    });
  }
});

// DELETE /api/lead-statuses/:id - Delete lead status (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;

    console.log('🔍 LeadStatuses DELETE - Status ID:', id);
    console.log('🔍 LeadStatuses DELETE - Company ID:', companyId);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to delete lead status'
      });
    }

    const leadStatus = await LeadStatus.findOneAndUpdate(
      { _id: id, companyId: companyId },
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!leadStatus) {
      return res.status(404).json({
        success: false,
        message: 'Lead status not found or does not belong to your company'
      });
    }

    res.json({
      success: true,
      message: 'Lead status deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting lead status' 
    });
  }
});

// POST /api/lead-statuses/reorder - Reorder lead statuses
router.post('/reorder', auth, async (req, res) => {
  try {
    const { statusIds } = req.body;
    const companyId = req.companyId;

    console.log('🔍 LeadStatuses REORDER - Company ID:', companyId);
    console.log('🔍 LeadStatuses REORDER - Status IDs:', statusIds);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to reorder lead statuses'
      });
    }

    if (!Array.isArray(statusIds)) {
      return res.status(400).json({
        success: false,
        message: 'statusIds must be an array'
      });
    }

    // Update order for each status (only for this company)
    const updatePromises = statusIds.map((statusId, index) => 
      LeadStatus.findOneAndUpdate(
        { _id: statusId, companyId: companyId },
        { order: index + 1 }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Lead statuses reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering lead statuses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while reordering lead statuses' 
    });
  }
});


module.exports = router;
