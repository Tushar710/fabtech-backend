const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Update employee permissions
router.put('/:employeeId/permissions', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { permission, value } = req.body;
    const companyId = req.companyId;

    console.log('🔧 Updating employee permissions:', { employeeId, permission, value, companyId });

    // Find employee and verify it belongs to the company
    const employee = await Employee.findOne({
      _id: employeeId,
      $or: [
        { company: companyId },
        { company: new mongoose.Types.ObjectId(companyId) }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not authorized'
      });
    }

    // Initialize permissions object if it doesn't exist
    if (!employee.accessPermissions) {
      employee.accessPermissions = [];
    }

    // Update the specific permission
    const permissionIndex = employee.accessPermissions.findIndex(p => p.feature === permission);
    
    if (permissionIndex >= 0) {
      employee.accessPermissions[permissionIndex].enabled = value;
    } else {
      employee.accessPermissions.push({
        feature: permission,
        enabled: value
      });
    }

    await employee.save();

    console.log('✅ Employee permissions updated successfully');

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: {
        employeeId,
        permissions: employee.accessPermissions
      }
    });

  } catch (error) {
    console.error('❌ Error updating employee permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee permissions',
      error: error.message
    });
  }
});

// Get employee permissions
router.get('/:employeeId/permissions', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const companyId = req.companyId;

    const employee = await Employee.findOne({
      _id: employeeId,
      $or: [
        { company: companyId },
        { company: new mongoose.Types.ObjectId(companyId) }
      ]
    }).select('accessPermissions teamMemberName teamMemberEmail');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: {
        employeeId,
        name: employee.teamMemberName,
        email: employee.teamMemberEmail,
        permissions: employee.accessPermissions || []
      }
    });

  } catch (error) {
    console.error('❌ Error fetching employee permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee permissions',
      error: error.message
    });
  }
});

module.exports = router;
