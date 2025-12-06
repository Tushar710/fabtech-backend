const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Branch Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Branch login attempt:', username);

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find branch by username or branchCode
    const branch = await Branch.findOne({
      $or: [
        { username: username },
        { branchCode: username }
      ],
      isActive: true
    }).select('+password').populate('company', 'businessName');

    if (!branch) {
      console.log('❌ Branch not found:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await branch.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for branch:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: branch._id,
        type: 'branch',
        companyId: branch.company._id,
        branchId: branch._id,
        permissions: branch.permissions
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Branch logged in successfully:', branch.name);

    // Remove password from response
    const branchData = branch.toObject();
    delete branchData.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      branch: branchData,
      userType: 'branch'
    });

  } catch (error) {
    console.error('Branch login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get current branch info
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'branch') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const branch = await Branch.findById(decoded.id)
      .populate('company', 'businessName')
      .populate('manager', 'teamMemberName email');

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    res.json({
      success: true,
      data: branch
    });

  } catch (error) {
    console.error('Error fetching branch info:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Get branch leads (only leads assigned to this branch)
router.get('/leads', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    console.log('🔍 Branch leads request - Decoded token:', {
      branchId: decoded.branchId,
      companyId: decoded.companyId,
      type: decoded.type
    });
    
    if (decoded.type !== 'branch') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const Lead = require('../models/Lead');
    const mongoose = require('mongoose');
    
    // Convert to ObjectId for proper comparison
    const branchObjectId = new mongoose.Types.ObjectId(decoded.branchId);
    const companyObjectId = decoded.companyId ? new mongoose.Types.ObjectId(decoded.companyId) : null;
    
    console.log('🔍 Searching for leads with:', {
      assignedBranch: branchObjectId.toString(),
      company: companyObjectId?.toString()
    });
    
    // Only get leads assigned to this branch
    const query = {
      assignedBranch: branchObjectId
    };
    
    if (companyObjectId) {
      query.company = companyObjectId;
    }
    
    const leads = await Lead.find(query)
      .populate('assignedEmployee', 'teamMemberName email')
      .populate('createdBy', 'teamMemberName email')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${leads.length} leads for branch:`, decoded.branchId);
    
    if (leads.length > 0) {
      console.log('📋 First lead sample:', {
        id: leads[0]._id,
        customerName: leads[0].customerName,
        assignedBranch: leads[0].assignedBranch,
        company: leads[0].company
      });
    }

    res.json({
      success: true,
      data: leads
    });

  } catch (error) {
    console.error('Error fetching branch leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads'
    });
  }
});

// Get branch statistics
router.get('/stats', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'branch') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const Employee = require('../models/Employee');
    const Lead = require('../models/Lead');

    // Employee count in branch
    const totalEmployees = await Employee.countDocuments({
      branch: decoded.branchId,
      company: decoded.companyId
    });

    const activeEmployees = await Employee.countDocuments({
      branch: decoded.branchId,
      company: decoded.companyId,
      isActive: true
    });

    // Lead count in branch
    const totalLeads = await Lead.countDocuments({
      assignedBranch: decoded.branchId,
      company: decoded.companyId
    });

    res.json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: totalEmployees - activeEmployees
        },
        leads: {
          total: totalLeads
        }
      }
    });

  } catch (error) {
    console.error('Error fetching branch stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Change branch password
router.put('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { currentPassword, newPassword } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'branch') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const branch = await Branch.findById(decoded.id).select('+password');

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Verify current password
    const isPasswordValid = await branch.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    branch.password = newPassword;
    await branch.save();

    console.log('✅ Branch password changed:', branch.name);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

module.exports = router;
