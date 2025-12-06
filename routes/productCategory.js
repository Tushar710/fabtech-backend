const express = require('express');
const router = express.Router();
const ProductCategory = require('../models/ProductCategory');
const auth = require('../middleware/auth');

// Get all categories for a company
router.get('/', auth, async (req, res) => {
  try {
    const categories = await ProductCategory.find({
      company: req.user.companyId,
      isActive: true
    }).sort({ type: 1, name: 1 });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Get categories by type
router.get('/type/:type', auth, async (req, res) => {
  try {
    const categories = await ProductCategory.find({
      company: req.user.companyId,
      type: req.params.type,
      isActive: true
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Create new category
router.post('/', auth, async (req, res) => {
  try {
    const category = await ProductCategory.create({
      ...req.body,
      company: req.user.companyId
    });
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

// Update category
router.put('/:id', auth, async (req, res) => {
  try {
    const category = await ProductCategory.findOneAndUpdate(
      { _id: req.params.id, company: req.user.companyId },
      req.body,
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await ProductCategory.findOneAndUpdate(
      { _id: req.params.id, company: req.user.companyId },
      { isActive: false },
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

module.exports = router;
