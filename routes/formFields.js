const express = require('express');
const router = express.Router();
const FormField = require('../models/FormField');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// GET /api/form-fields - Get all form fields
router.get('/', auth, async (req, res) => {
  try {
    const companyId = req.companyId;
    
    console.log('🔍 FormFields GET - Full Request User:', JSON.stringify(req.user, null, 2));
    console.log('🔍 FormFields GET - Company ID from req.companyId:', companyId);
    console.log('🔍 FormFields GET - User Role:', req.user?.role);
    console.log('🔍 FormFields GET - User ID:', req.user?.id);
    
    // Company filtering is mandatory for form fields
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch form fields'
      });
    }
    
    const query = { 
      active: true,
      companyId: companyId
    };
    
    console.log('🔍 FormFields GET - Query:', query);
    
    const fields = await FormField.find(query).sort({ order: 1, createdAt: 1 });
    
    console.log('🔍 FormFields GET - Found fields:', fields.length);
    fields.forEach(field => {
      console.log(`  - ${field.name} (Company: ${field.companyId})`);
    });
    
    res.json({
      success: true,
      fields
    });
  } catch (error) {
    console.error('Error fetching form fields:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching form fields' 
    });
  }
});

// POST /api/form-fields - Create new form field
router.post('/', auth, async (req, res) => {
  try {
    const companyId = req.companyId;
    
    console.log('🔍 FormFields POST - Full Request User:', JSON.stringify(req.user, null, 2));
    console.log('🔍 FormFields POST - Company ID from req.companyId:', companyId);
    console.log('🔍 FormFields POST - User Role:', req.user?.role);
    console.log('🔍 FormFields POST - User ID:', req.user?.id);
    
    const {
      name,
      label,
      type,
      placeholder,
      required,
      options,
      validation,
      order,
      formType
    } = req.body;

    // Validation
    if (!name || !label || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name, label, and type are required'
      });
    }

    // Check if field name already exists for this company
    let existingQuery = { name: name.toLowerCase() };
    if (companyId) {
      existingQuery.companyId = companyId;
    }
    
    console.log('🔍 FormFields POST - Checking existing with query:', existingQuery);
    
    const existingField = await FormField.findOne(existingQuery);
    if (existingField) {
      return res.status(400).json({
        success: false,
        message: 'Field name already exists',
        existingField: {
          id: existingField._id,
          name: existingField.name,
          label: existingField.label,
          type: existingField.type,
          options: existingField.options
        }
      });
    }

    // Ensure companyId is always set for new fields
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to create form fields'
      });
    }

    const formField = new FormField({
      name: name.toLowerCase().replace(/\s+/g, '_'),
      label,
      type,
      placeholder: placeholder || '',
      required: required || false,
      options: options || [],
      validation: validation || {},
      order: order || 0,
      formType: formType || 'both',
      companyId: new mongoose.Types.ObjectId(companyId)
    });
    
    console.log('🔍 FormFields POST - Creating field with companyId:', companyId);

    await formField.save();

    res.status(201).json({
      success: true,
      message: 'Form field created successfully',
      field: formField
    });
  } catch (error) {
    console.error('Error creating form field:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating form field' 
    });
  }
});

// PUT /api/form-fields/:id - Update form field
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const companyId = req.companyId;

    console.log('🔍 FormFields PUT - Field ID:', id);
    console.log('🔍 FormFields PUT - Company ID:', companyId);
    console.log('🔍 FormFields PUT - Update Data:', JSON.stringify(updateData, null, 2));

    // Company filtering is mandatory
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to update form fields'
      });
    }

    const query = { _id: id, companyId: companyId };
    console.log('🔍 FormFields PUT - Query:', query);

    const formField = await FormField.findOneAndUpdate(
      query,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    console.log('🔍 FormFields PUT - Found field:', formField ? 'Yes' : 'No');

    if (!formField) {
      return res.status(404).json({
        success: false,
        message: 'Form field not found or does not belong to your company'
      });
    }

    res.json({
      success: true,
      message: 'Form field updated successfully',
      field: formField
    });
  } catch (error) {
    console.error('Error updating form field:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating form field' 
    });
  }
});

// DELETE /api/form-fields/:id - Delete form field (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;

    console.log('🔍 FormFields DELETE - Field ID:', id);
    console.log('🔍 FormFields DELETE - Company ID:', companyId);

    // Company filtering is mandatory
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to delete form fields'
      });
    }

    const formField = await FormField.findOneAndUpdate(
      { _id: id, companyId: companyId },
      { active: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!formField) {
      return res.status(404).json({
        success: false,
        message: 'Form field not found or does not belong to your company'
      });
    }

    res.json({
      success: true,
      message: 'Form field deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting form field:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting form field' 
    });
  }
});

// POST /api/form-fields/reorder - Reorder form fields
router.post('/reorder', auth, async (req, res) => {
  try {
    const { fieldIds } = req.body; // Array of field IDs in new order
    const companyId = req.companyId;

    console.log('🔍 FormFields REORDER - Company ID:', companyId);
    console.log('🔍 FormFields REORDER - Field IDs:', fieldIds);

    // Company filtering is mandatory
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to reorder form fields'
      });
    }

    if (!Array.isArray(fieldIds)) {
      return res.status(400).json({
        success: false,
        message: 'fieldIds must be an array'
      });
    }

    // Update order for each field (only for this company)
    const updatePromises = fieldIds.map((fieldId, index) => 
      FormField.findOneAndUpdate(
        { _id: fieldId, companyId: companyId },
        { order: index }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Form fields reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering form fields:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while reordering form fields' 
    });
  }
});

module.exports = router;
