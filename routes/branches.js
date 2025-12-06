const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const Employee = require('../models/Employee');
const { validationResult, body } = require('express-validator');
const auth = require('../middleware/auth');

// Get all branches (company-specific)
router.get('/', auth, async (req, res) => {
  try {
    console.log('🔍 Fetching branches for company:', req.companyId);
    
    let query = {};
    if (req.companyId) {
      query.company = req.companyId;
    }
    
    const branches = await Branch.find(query)
      .populate('company', 'businessName')
      .populate('manager', 'teamMemberName')
      .sort({ name: 1 });

    console.log(`📊 Found ${branches.length} branches for company ${req.companyId}`);
    res.json({
      success: true,
      data: branches
    });

  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branches'
    });
  }
});

// Get branch by ID (company-filtered)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    let query = { _id: id };
    if (req.companyId) {
      query.company = req.companyId;
    }

    const branch = await Branch.findOne(query)
      .populate('company', 'businessName')
      .populate('manager', 'teamMemberName teamMemberEmail');
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Get employee count for this branch
    const employeeCount = await Employee.countDocuments({ 
      company: req.companyId,
      // Assuming employees might have branch field in future
    });

    const branchWithCount = {
      ...branch.toObject(),
      employeeCount
    };

    res.json({
      success: true,
      data: branchWithCount
    });

  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branch'
    });
  }
});

// Create branch
router.post('/', auth, [
  body('name').notEmpty().withMessage('Branch name is required'),
  body('address').optional().isString(),
  body('city').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isEmail().withMessage('Valid email is required')
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

    // Auto-assign company ID from JWT token
    const branchData = {
      ...req.body,
      company: req.companyId
    };

    // Remove manager field if empty string
    if (branchData.manager === '' || branchData.manager === null) {
      delete branchData.manager;
    }

    // Generate automatic login credentials if not provided
    if (!branchData.username) {
      // Generate username from branch name (lowercase, no spaces)
      const baseUsername = branchData.name.toLowerCase().replace(/\s+/g, '');
      let username = baseUsername;
      let counter = 1;
      
      // Check if username exists, add number if needed
      while (await Branch.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      branchData.username = username;
    }

    // Generate branch code if not provided
    if (!branchData.branchCode) {
      const branchCode = branchData.name.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
      branchData.branchCode = branchCode;
    }

    // Generate default password if not provided
    if (!branchData.password) {
      branchData.password = 'branch@123'; // Default password
    }

    const branch = new Branch(branchData);
    await branch.save();

    const populatedBranch = await Branch.findById(branch._id)
      .populate('company', 'businessName')
      .populate('manager', 'teamMemberName teamMemberEmail');

    console.log('✅ Branch created:', branch.name, 'for company:', req.companyId);
    console.log('🔑 Branch credentials - Username:', branchData.username, '| Branch Code:', branchData.branchCode);
    
    res.status(201).json({
      success: true,
      data: populatedBranch,
      credentials: {
        username: branchData.username,
        branchCode: branchData.branchCode,
        password: 'branch@123' // Show only on creation
      },
      message: 'Branch created successfully with login credentials'
    });

  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create branch'
    });
  }
});

// Update branch (company-filtered)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    let query = { _id: id };
    if (req.companyId) {
      query.company = req.companyId;
    }

    // Remove manager field if empty string
    const updateData = { ...req.body, updatedAt: Date.now() };
    if (updateData.manager === '' || updateData.manager === null) {
      delete updateData.manager;
    }

    // Hash password if it's being updated
    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(updateData.password, 10);
      console.log('🔐 Password hashed for branch update');
    }

    const branch = await Branch.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    ).populate('company', 'businessName')
     .populate('manager', 'teamMemberName teamMemberEmail');

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    console.log('✅ Branch updated:', branch.name);
    res.json({
      success: true,
      data: branch,
      message: 'Branch updated successfully'
    });

  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update branch'
    });
  }
});

// Delete branch (company-filtered)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    let query = { _id: id };
    if (req.companyId) {
      query.company = req.companyId;
    }

    // Check if branch has employees (if branch field exists in Employee model)
    // const employeeCount = await Employee.countDocuments({ branch: id });
    // if (employeeCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete branch. It has ${employeeCount} employees assigned.`
    //   });
    // }

    const branch = await Branch.findOneAndDelete(query);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    console.log('✅ Branch deleted:', branch.name);
    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete branch'
    });
  }
});

// Get branch statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    let query = { _id: id };
    if (req.companyId) {
      query.company = req.companyId;
    }

    const branch = await Branch.findOne(query);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Get employee statistics for this company (since branch field might not exist in Employee model yet)
    const totalEmployees = await Employee.countDocuments({ company: req.companyId });
    const activeEmployees = await Employee.countDocuments({ 
      company: req.companyId,
      isActive: { $ne: false } 
    });

    const stats = {
      branchName: branch.name,
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      branchInfo: {
        address: branch.address,
        city: branch.city,
        state: branch.state,
        phone: branch.phone,
        email: branch.email
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching branch stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branch statistics'
    });
  }
});

module.exports = router;
