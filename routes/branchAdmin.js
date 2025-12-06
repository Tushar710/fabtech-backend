const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Lead = require('../models/Lead');
const jwt = require('jsonwebtoken');

// Middleware to verify branch admin token
const verifyBranchAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Fetch employee with branch details
    const employee = await Employee.findById(decoded.id)
      .populate('branch', 'name permissions')
      .populate('company', 'businessName');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if employee is branch admin
    if (!employee.isBranchAdmin && employee.role !== 'Branch Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Branch Admin privileges required.'
      });
    }

    req.employee = employee;
    req.employeeId = employee._id;
    req.branchId = employee.branch?._id;
    req.companyId = employee.company;
    req.permissions = employee.branch?.permissions || {};
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Get all employees in branch admin's branch
router.get('/employees', verifyBranchAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching employees for branch:', req.branchId);

    const employees = await Employee.find({
      branch: req.branchId,
      company: req.companyId
    })
    .populate('branch', 'name')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${employees.length} employees in branch`);

    res.json({
      success: true,
      data: employees
    });

  } catch (error) {
    console.error('Error fetching branch employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees'
    });
  }
});

// Create new employee in branch admin's branch
router.post('/employees', verifyBranchAdmin, async (req, res) => {
  try {
    const employeeData = {
      ...req.body,
      branch: req.branchId,
      company: req.companyId,
      isBranchAdmin: false, // Branch admin cannot create another branch admin
      isActive: true
    };

    // Hash password if provided
    if (employeeData.password) {
      const bcrypt = require('bcryptjs');
      employeeData.password = await bcrypt.hash(employeeData.password, 10);
    }

    const employee = new Employee(employeeData);
    await employee.save();

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('branch', 'name');

    console.log('✅ Employee created by branch admin:', employee.teamMemberName);

    res.status(201).json({
      success: true,
      data: populatedEmployee,
      message: 'Employee created successfully'
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee'
    });
  }
});

// Update employee in branch admin's branch
router.put('/employees/:id', verifyBranchAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify employee belongs to branch admin's branch
    const existingEmployee = await Employee.findOne({
      _id: id,
      branch: req.branchId,
      company: req.companyId
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found in your branch'
      });
    }

    // Prevent changing branch or making someone branch admin
    const updateData = { ...req.body };
    delete updateData.branch;
    delete updateData.isBranchAdmin;
    delete updateData.company;

    // Hash password if provided
    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password; // Don't update if not provided
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('branch', 'name');

    console.log('✅ Employee updated by branch admin:', employee.teamMemberName);

    res.json({
      success: true,
      data: employee,
      message: 'Employee updated successfully'
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee'
    });
  }
});

// Delete employee in branch admin's branch
router.delete('/employees/:id', verifyBranchAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify employee belongs to branch admin's branch
    const employee = await Employee.findOne({
      _id: id,
      branch: req.branchId,
      company: req.companyId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found in your branch'
      });
    }

    // Prevent deleting another branch admin
    if (employee.isBranchAdmin || employee.role === 'Branch Admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete another branch admin'
      });
    }

    await Employee.findByIdAndDelete(id);

    console.log('✅ Employee deleted by branch admin:', employee.teamMemberName);

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee'
    });
  }
});

// Get branch statistics
router.get('/stats', verifyBranchAdmin, async (req, res) => {
  try {
    // Employee count in branch
    const totalEmployees = await Employee.countDocuments({
      branch: req.branchId,
      company: req.companyId
    });

    const activeEmployees = await Employee.countDocuments({
      branch: req.branchId,
      company: req.companyId,
      isActive: true
    });

    // Lead count in branch
    const totalLeads = await Lead.countDocuments({
      assignedBranch: req.branchId,
      company: req.companyId
    });

    // Lead status breakdown
    const leadsByStatus = await Lead.aggregate([
      {
        $match: {
          assignedBranch: req.branchId,
          company: req.companyId
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: totalEmployees - activeEmployees
        },
        leads: {
          total: totalLeads,
          byStatus: leadsByStatus
        },
        branch: {
          name: req.employee.branch?.name,
          permissions: req.permissions
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

// Get branch leads
router.get('/leads', verifyBranchAdmin, async (req, res) => {
  try {
    const leads = await Lead.find({
      assignedBranch: req.branchId,
      company: req.companyId
    })
    .populate('assignedEmployee', 'teamMemberName email')
    .populate('createdBy', 'teamMemberName email')
    .sort({ createdAt: -1 });

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

// Assign lead to employee in branch
router.put('/leads/:leadId/assign', verifyBranchAdmin, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { employeeId } = req.body;

    // Verify employee belongs to branch
    const employee = await Employee.findOne({
      _id: employeeId,
      branch: req.branchId,
      company: req.companyId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found in your branch'
      });
    }

    // Update lead
    const lead = await Lead.findByIdAndUpdate(
      leadId,
      {
        assignedEmployee: employeeId,
        assignedEmployeeName: employee.teamMemberName,
        assignedEmployeeEmail: employee.email,
        assignedBranch: req.branchId,
        assignedBranchName: req.employee.branch?.name
      },
      { new: true }
    ).populate('assignedEmployee', 'teamMemberName email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    console.log('✅ Lead assigned by branch admin to:', employee.teamMemberName);

    res.json({
      success: true,
      data: lead,
      message: 'Lead assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign lead'
    });
  }
});

module.exports = router;
