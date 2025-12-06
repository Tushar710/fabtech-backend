const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const jwt = require('jsonwebtoken');

// Middleware to verify employee token
const verifyEmployeeToken = async (req, res, next) => {
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
      .populate('department', 'name');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    req.employee = employee;
    req.employeeId = employee._id;
    req.branchId = employee.branch?._id;
    req.departmentId = employee.department?._id;
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

// Get leads for employee dashboard
// Returns: Own leads + Assigned leads
router.get('/my-leads', verifyEmployeeToken, async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    
    console.log('📊 Fetching leads for employee:', req.employee.teamMemberName);
    console.log('📊 Branch:', req.employee.branch?.name);
    console.log('📊 Filter:', filter);

    let query = {
      company: req.companyId
    };

    // Build query based on filter
    if (filter === 'my-created') {
      // Leads created by this employee
      query.createdBy = req.employeeId;
    } else if (filter === 'assigned-to-me') {
      // Leads assigned to this employee
      query.assignedEmployee = req.employeeId;
    } else if (filter === 'branch') {
      // All leads in branch (if permission allows)
      if (req.permissions.canViewAllLeads) {
        query.assignedBranch = req.branchId;
      } else {
        // Only own and assigned leads
        query.$or = [
          { createdBy: req.employeeId },
          { assignedEmployee: req.employeeId }
        ];
      }
    } else {
      // 'all' - Own created + Assigned to me
      query.$or = [
        { createdBy: req.employeeId },
        { assignedEmployee: req.employeeId }
      ];
    }

    const leads = await Lead.find(query)
      .populate('assignedEmployee', 'teamMemberName email')
      .populate('assignedBranch', 'name')
      .populate('assignedDepartment', 'name')
      .populate('createdBy', 'teamMemberName email')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${leads.length} leads for employee`);

    // Categorize leads
    const categorized = {
      myCreated: leads.filter(lead => 
        lead.createdBy?._id?.toString() === req.employeeId.toString()
      ),
      assignedToMe: leads.filter(lead => 
        lead.assignedEmployee?._id?.toString() === req.employeeId.toString()
      ),
      branchLeads: leads.filter(lead => 
        lead.assignedBranch?._id?.toString() === req.branchId?.toString()
      )
    };

    res.json({
      success: true,
      data: leads,
      categorized,
      stats: {
        total: leads.length,
        myCreated: categorized.myCreated.length,
        assignedToMe: categorized.assignedToMe.length,
        branchLeads: categorized.branchLeads.length
      },
      permissions: req.permissions
    });

  } catch (error) {
    console.error('Error fetching employee leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads'
    });
  }
});

// Get lead statistics for employee
router.get('/stats', verifyEmployeeToken, async (req, res) => {
  try {
    const employeeId = req.employeeId;
    const departmentId = req.departmentId;
    const companyId = req.companyId;

    // My created leads stats
    const myCreatedStats = await Lead.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(employeeId),
          company: new mongoose.Types.ObjectId(companyId)
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]);

    // Assigned to me stats
    const assignedToMeStats = await Lead.aggregate([
      {
        $match: {
          assignedEmployee: new mongoose.Types.ObjectId(employeeId),
          company: new mongoose.Types.ObjectId(companyId)
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]);

    // Branch stats (if permission allows)
    let branchStats = [];
    if (req.permissions.canViewAllLeads && branchId) {
      branchStats = await Lead.aggregate([
        {
          $match: {
            assignedBranch: new mongoose.Types.ObjectId(branchId),
            company: new mongoose.Types.ObjectId(companyId)
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' }
          }
        }
      ]);
    }

    res.json({
      success: true,
      data: {
        myCreated: myCreatedStats,
        assignedToMe: assignedToMeStats,
        branch: branchStats
      }
    });

  } catch (error) {
    console.error('Error fetching employee stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Create new lead (if permission allows)
router.post('/create', verifyEmployeeToken, async (req, res) => {
  try {
    // Check permission
    if (!req.permissions.canAddLead) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add leads'
      });
    }

    const leadData = {
      ...req.body,
      company: req.companyId,
      createdBy: req.employeeId,
      createdByModel: 'Employee',
      createdByName: req.employee.teamMemberName,
      createdByBranch: req.branchId,
      createdByDepartment: req.departmentId
    };

    const lead = new Lead(leadData);
    await lead.save();

    console.log('✅ Lead created by employee:', req.employee.teamMemberName);

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created successfully'
    });

  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lead'
    });
  }
});

// Update lead (if permission allows)
router.put('/:leadId', verifyEmployeeToken, async (req, res) => {
  try {
    const { leadId } = req.params;

    // Check permission
    if (!req.permissions.canEditLead) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit leads'
      });
    }

    // Find lead and verify access
    const lead = await Lead.findOne({
      _id: leadId,
      $or: [
        { createdBy: req.employeeId },
        { assignedEmployee: req.employeeId },
        ...(req.permissions.canViewAllLeads ? [{ assignedBranch: req.branchId }] : [])
      ]
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied'
      });
    }

    // Update lead
    Object.assign(lead, req.body);
    await lead.save();

    console.log('✅ Lead updated by employee:', req.employee.teamMemberName);

    res.json({
      success: true,
      data: lead,
      message: 'Lead updated successfully'
    });

  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead'
    });
  }
});

// Delete lead (if permission allows)
router.delete('/:leadId', verifyEmployeeToken, async (req, res) => {
  try {
    const { leadId } = req.params;

    // Check permission
    if (!req.permissions.canDeleteLead) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete leads'
      });
    }

    // Find and delete lead
    const lead = await Lead.findOneAndDelete({
      _id: leadId,
      createdBy: req.employeeId // Only creator can delete
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or you can only delete leads you created'
      });
    }

    console.log('✅ Lead deleted by employee:', req.employee.teamMemberName);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lead'
    });
  }
});

module.exports = router;
