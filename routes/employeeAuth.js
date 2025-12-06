const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const Department = require('../models/Department');

// Employee Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Employee login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find employee by email
    const employee = await Employee.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    })
    .populate('branch', 'name permissions')
    .populate('department', 'name')
    .populate('company', 'businessName');

    if (!employee) {
      console.log('❌ Employee not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for employee:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    console.log('🔑 Generating token for employee:', {
      _id: employee._id,
      name: employee.teamMemberName,
      companyId: employee.company?._id
    });
    
    const token = jwt.sign(
      {
        id: employee._id,
        employeeId: employee._id,
        email: employee.email,
        role: 'employee',
        employeeRole: employee.role,
        branchId: employee.branch?._id,
        departmentId: employee.department?._id,
        companyId: employee.company?._id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Employee login successful:', employee.teamMemberName);
    console.log('🎫 Token payload:', { id: employee._id, employeeId: employee._id, companyId: employee.company?._id });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      employee: {
        _id: employee._id,
        name: employee.teamMemberName,
        email: employee.email,
        role: employee.role,
        isBranchAdmin: employee.isBranchAdmin,
        branch: employee.branch,
        department: employee.department,
        company: employee.company,
        permissions: employee.branch?.permissions || {},
        accessPermissions: employee.accessPermissions || []
      }
    });

  } catch (error) {
    console.error('Error in employee login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// Get current employee profile
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
    
    const employee = await Employee.findById(decoded.id)
      .populate('branch', 'name permissions')
      .populate('department', 'name')
      .populate('company', 'businessName');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: {
        _id: employee._id,
        name: employee.teamMemberName,
        email: employee.email,
        role: employee.role,
        branch: employee.branch,
        department: employee.department,
        company: employee.company,
        permissions: employee.branch?.permissions || {},
        accessPermissions: employee.accessPermissions || []
      }
    });

  } catch (error) {
    console.error('Error fetching employee profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Change employee password
router.post('/change-password', async (req, res) => {
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
    const employee = await Employee.findById(decoded.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, employee.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    employee.password = hashedPassword;
    await employee.save();

    console.log('✅ Password changed for employee:', employee.teamMemberName);

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
