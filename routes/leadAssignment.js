const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Company = require('../models/Company');
const { validationResult, body } = require('express-validator');
const mongoose = require('mongoose');
const LeadLifecycleMessaging = require('../services/leadLifecycleMessaging');
const auth = require('../middleware/auth');

// Test route to verify API is working
router.get('/test', async (req, res) => {
  try {
    const companiesCount = await Company.countDocuments();
    const departmentsCount = await Department.countDocuments();
    const employeesCount = await Employee.countDocuments();
    const leadsCount = await Lead.countDocuments();
    
    res.json({
      success: true,
      message: 'Lead Assignment API is working!',
      data: {
        companies: companiesCount,
        departments: departmentsCount,
        employees: employeesCount,
        leads: leadsCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// Get sales team members from existing database
router.get('/sales-team', async (req, res) => {
  try {
    console.log('🔍 Fetching sales team using employees endpoint...');
    
    // Use the existing employees endpoint logic that's already working
    const db = mongoose.connection.db;
    const employeesCollection = db.collection('employees');
    
    // Fetch all employees using the same approach as /employees endpoint
    const allEmployees = await employeesCollection.find({}).toArray();
    
    console.log(`📊 Found ${allEmployees.length} total employees from database`);

    // Add virtual fields manually for compatibility
    const employeesWithVirtuals = allEmployees.map(emp => ({
      ...emp,
      name: emp.teamMemberName || 'Unknown', // Add virtual name field
      phone: emp.emergencyMobileNumber || 'No phone' // Add virtual phone field
    }));

    // Filter employees who have valid names
    const salesTeam = employeesWithVirtuals.filter(employee => {
      const hasName = employee.teamMemberName && employee.teamMemberName.trim() !== '';
      return hasName; // Return all employees with valid names
    });

    // Format the response to match the expected structure
    const formattedSalesTeam = salesTeam.map(employee => ({
      _id: employee._id,
      name: employee.teamMemberName || employee.name,
      email: employee.teamMemberEmail || employee.email || 'No email provided',
      phone: employee.emergencyMobileNumber || employee.phone || 'No phone provided',
      role: employee.role || 'Sales Representative',
      company: 'Company Info', // Simplified for now to avoid ObjectId errors
      isActive: true // Assume active if in database
    }));

    console.log(`✅ Formatted ${formattedSalesTeam.length} sales team members`);

    if (formattedSalesTeam.length === 0) {
      console.log('⚠️ No sales team members found in database');
    }

    res.json({
      success: true,
      data: formattedSalesTeam,
      message: `Found ${formattedSalesTeam.length} sales team members from database`
    });
  } catch (error) {
    console.error('🚨 Error fetching sales team:', error.message);
    console.error('🚨 Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales team',
      error: error.message
    });
  }
});

// Get all companies
router.get('/companies', async (req, res) => {
  try {
    console.log('🏢 Fetching companies from database...');
    
    const companies = await Company.find({})
      .select('businessName businessEmail businessPhone businessAddress businessCategory createdAt')
      .sort({ businessName: 1 });

    console.log(`✅ Found ${companies.length} companies`);

    const formattedCompanies = companies.map(company => ({
      _id: company._id,
      name: company.businessName,
      email: company.businessEmail,
      phone: company.businessPhone,
      address: company.businessAddress,
      category: company.businessCategory,
      createdAt: company.createdAt
    }));

    res.json({
      success: true,
      data: formattedCompanies,
      message: `Found ${formattedCompanies.length} companies`
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies'
    });
  }
});

// Get departments by company
router.get('/departments/:companyId?', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log(`🏢 Fetching departments${companyId ? ` for company ${companyId}` : ''}...`);
    
    let query = {};
    if (companyId) {
      query.company = companyId;
    }
    
    const departments = await Department.find(query)
      .populate('company', 'businessName')
      .select('name company createdAt')
      .sort({ name: 1 });

    console.log(`✅ Found ${departments.length} departments`);

    const formattedDepartments = departments.map(dept => ({
      _id: dept._id,
      name: dept.name,
      company: dept.company ? {
        _id: dept.company._id,
        name: dept.company.businessName
      } : null,
      createdAt: dept.createdAt
    }));

    res.json({
      success: true,
      data: formattedDepartments,
      message: `Found ${formattedDepartments.length} departments`
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments'
    });
  }
});

// Get employees by company
router.get('/employees/:companyId?', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log(`👥 Fetching employees${companyId ? ` for company ${companyId}` : ''}...`);
    
    let query = {};
    if (companyId) {
      query.company = companyId;
    }
    
    const employees = await Employee.find(query)
      .populate('company', 'businessName')
      .select('teamMemberName teamMemberEmail emergencyMobileNumber email role company salary dateOfJoining')
      .sort({ teamMemberName: 1 });

    console.log(`✅ Found ${employees.length} employees`);

    const formattedEmployees = employees.map(emp => ({
      _id: emp._id,
      name: emp.teamMemberName,
      email: emp.teamMemberEmail,
      phone: emp.emergencyMobileNumber,
      role: emp.role,
      salary: emp.salary,
      dateOfJoining: emp.dateOfJoining,
      company: emp.company ? {
        _id: emp.company._id,
        name: emp.company.businessName
      } : null
    }));

    res.json({
      success: true,
      data: formattedEmployees,
      message: `Found ${formattedEmployees.length} employees`
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees'
    });
  }
});

// Assign lead to sales person
router.put('/assign/:leadId', [
  body('assignedTo').notEmpty().withMessage('Sales person is required'),
  body('assignmentNotes').optional().isLength({ max: 500 }).withMessage('Notes too long')
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

    const { leadId } = req.params;
    const { assignedTo, assignmentNotes, priority } = req.body;

    // Check if lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check if sales person exists using direct MongoDB query
    const db = mongoose.connection.db;
    const salesPerson = await db.collection('employees').findOne({ 
      _id: new mongoose.Types.ObjectId(assignedTo)
    });
    if (!salesPerson) {
      return res.status(404).json({
        success: false,
        message: 'Sales person not found'
      });
    }

    // Update lead with assignment
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      {
        assignedTo: assignedTo,
        assignmentDate: new Date(),
        assignedAt: new Date(),
        assignmentNotes: assignmentNotes || '',
        priority: priority || lead.priority,
        status: lead.status === 'new' ? 'contacted' : lead.status, // Auto-update status if new
        lastContact: new Date(),
        // Store employee details for quick access
        assignedEmployeeName: salesPerson.teamMemberName || salesPerson.name || 'Unknown',
        assignedEmployeePhone: salesPerson.emergencyMobileNumber || salesPerson.phone || salesPerson.teamMemberMobile || '',
        assignedEmployeeEmail: salesPerson.teamMemberEmail || salesPerson.email || '',
        // Add assignment follow-up
        $push: {
          followUps: {
            type: 'assignment',
            summary: `Lead assigned to ${salesPerson.name}`,
            notes: assignmentNotes || `Lead assigned to ${salesPerson.name} (${salesPerson.role})`,
            date: new Date(),
            completed: false,
            assignedBy: req.user?.id || null
          }
        }
      },
      { new: true }
    ).populate('assignedTo', 'name email role');

    // Send assignment notification message
    await LeadLifecycleMessaging.sendAssignmentNotification(
      leadId, 
      salesPerson.teamMemberName || salesPerson.name || 'Support Team'
    );

    res.json({
      success: true,
      message: 'Lead assigned successfully',
      data: updatedLead
    });

  } catch (error) {
    console.error('Error assigning lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign lead'
    });
  }
});

// Bulk assign multiple leads
router.put('/bulk-assign', auth, [
  body('leadIds').isArray().withMessage('Lead IDs must be an array'),
  body('assignmentNotes').optional().isLength({ max: 500 }).withMessage('Notes too long')
], async (req, res) => {
  try {
    console.log('🔄 Bulk assign request received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { leadIds, assignedTo, assignedBranch, assignmentNotes, priority } = req.body;
    
    // Validate that either assignedTo or assignedBranch is provided
    if (!assignedTo && !assignedBranch) {
      return res.status(400).json({
        success: false,
        message: 'Either employee (assignedTo) or branch (assignedBranch) must be provided'
      });
    }
    
    // Convert string IDs to ObjectIds
    let objectIdLeadIds;
    try {
      objectIdLeadIds = leadIds.map(id => new mongoose.Types.ObjectId(id));
    } catch (idError) {
      console.log('❌ Invalid lead IDs:', leadIds);
      return res.status(400).json({
        success: false,
        message: 'Invalid lead IDs provided'
      });
    }

    const db = mongoose.connection.db;
    
    console.log('🔍 Request context:', {
      'req.company': req.company,
      'req.user': req.user,
      'req.companyId': req.companyId,
      'req.body': req.body
    });
    
    const companyId = req.company?.id || req.user?.companyId || req.companyId;
    
    let updateData = {
      assignmentDate: new Date(),
      assignedAt: new Date(),
      assignmentNotes: assignmentNotes || '',
      priority: priority || 'medium',
      lastContact: new Date(),
      company: companyId ? new mongoose.Types.ObjectId(companyId) : null
    };
    
    console.log('🏢 Setting company ID:', companyId);
    console.log('📝 Update data company field:', updateData.company);
    
    let assignmentSummary = '';
    
    // Branch assignment
    if (assignedBranch) {
      const branch = await db.collection('branches').findOne({ 
        _id: new mongoose.Types.ObjectId(assignedBranch)
      });
      
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }
      
      updateData.assignedBranch = new mongoose.Types.ObjectId(assignedBranch);
      updateData.assignedBranchName = branch.name;
      assignmentSummary = `Lead assigned to ${branch.name} branch`;
      
      console.log('🏢 Setting assignedBranch:', {
        branchId: updateData.assignedBranch,
        branchName: updateData.assignedBranchName,
        leadIds: objectIdLeadIds.length
      });
    }
    
    // Employee assignment
    if (assignedTo) {
      const salesPerson = await db.collection('employees').findOne({ 
        _id: new mongoose.Types.ObjectId(assignedTo)
      });
      
      if (!salesPerson) {
        return res.status(404).json({
          success: false,
          message: 'Sales person not found'
        });
      }
      
      updateData.assignedTo = assignedTo;
      updateData.assignedEmployeeName = salesPerson.teamMemberName || salesPerson.name || 'Unknown';
      updateData.assignedEmployeePhone = salesPerson.emergencyMobileNumber || salesPerson.phone || salesPerson.teamMemberMobile || '';
      updateData.assignedEmployeeEmail = salesPerson.teamMemberEmail || salesPerson.email || '';
      assignmentSummary = `Lead assigned to ${salesPerson.teamMemberName || salesPerson.name}`;
    }

    console.log('📝 Update data:', updateData);
    console.log('📋 Lead IDs to update:', objectIdLeadIds);

    // Update multiple leads
    const updateResult = await Lead.updateMany(
      { _id: { $in: objectIdLeadIds } },
      {
        $set: updateData,
        $push: {
          followUps: {
            type: 'assignment',
            summary: assignmentSummary,
            notes: assignmentNotes || assignmentSummary,
            date: new Date(),
            completed: false,
            assignedBy: req.user?.id || null
          }
        }
      }
    );
    
    console.log('✅ Update result:', updateResult);
    
    // Verify the update by fetching one lead
    if (objectIdLeadIds.length > 0) {
      const verifyLead = await Lead.findById(objectIdLeadIds[0]);
      console.log('🔍 Verification - Lead after update:', {
        leadId: verifyLead._id,
        assignedBranch: verifyLead.assignedBranch,
        assignedBranchName: verifyLead.assignedBranchName,
        company: verifyLead.company
      });
    }

    // Send assignment notifications for bulk assigned leads (only for employee assignment)
    if (assignedTo) {
      const salesPerson = await db.collection('employees').findOne({ 
        _id: new mongoose.Types.ObjectId(assignedTo)
      });
      
      if (salesPerson) {
        for (const leadId of leadIds) {
          await LeadLifecycleMessaging.sendAssignmentNotification(
            leadId, 
            salesPerson.teamMemberName || salesPerson.name || 'Support Team'
          );
        }
      }
    }

    const assignmentTarget = assignedBranch 
      ? updateData.assignedBranchName 
      : updateData.assignedEmployeeName;

    res.json({
      success: true,
      message: `${updateResult.modifiedCount} leads assigned to ${assignmentTarget} successfully`,
      data: {
        assignedCount: updateResult.modifiedCount,
        assignedTo: assignmentTarget,
        assignedBranch: assignedBranch || null,
        assignedEmployee: assignedTo || null
      }
    });

  } catch (error) {
    console.error('Error bulk assigning leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk assign leads'
    });
  }
});

// Enhanced bulk assign with distribution algorithms
router.put('/bulk-assign-enhanced', [
  body('assignments').isArray().withMessage('Assignments must be an array')
], async (req, res) => {
  try {
    console.log('🔄 Enhanced bulk assign request received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { assignments, assignmentNotes, priority } = req.body;
    let totalAssigned = 0;
    const employeeStats = {};
    
    // Group assignments by employee
    for (const assignment of assignments) {
      const { leadId, employeeId, notes, priority: assignmentPriority } = assignment;
      
      if (!employeeStats[employeeId]) {
        employeeStats[employeeId] = {
          leadIds: [],
          notes: notes || assignmentNotes || '',
          priority: assignmentPriority || priority || 'medium'
        };
      }
      
      employeeStats[employeeId].leadIds.push(leadId);
    }
    
    const results = [];
    
    // Process each employee's assignments
    for (const [employeeId, stats] of Object.entries(employeeStats)) {
      try {
        // Convert string IDs to ObjectIds
        const objectIdLeadIds = stats.leadIds.map(id => new mongoose.Types.ObjectId(id));
        
        // Check if sales person exists
        const db = mongoose.connection.db;
        const salesPerson = await db.collection('employees').findOne({ 
          _id: new mongoose.Types.ObjectId(employeeId)
        });
        
        if (!salesPerson) {
          console.log('❌ Sales person not found:', employeeId);
          continue;
        }

        // Update leads for this employee
        const updateResult = await Lead.updateMany(
          { _id: { $in: objectIdLeadIds } },
          {
            $set: {
              assignedTo: employeeId,
              assignmentDate: new Date(),
              assignedAt: new Date(),
              assignmentNotes: stats.notes,
              priority: stats.priority,
              lastContact: new Date(),
              // Store employee details for quick access
              assignedEmployeeName: salesPerson.teamMemberName || salesPerson.name || 'Unknown',
              assignedEmployeePhone: salesPerson.emergencyMobileNumber || salesPerson.phone || salesPerson.teamMemberMobile || '',
              assignedEmployeeEmail: salesPerson.teamMemberEmail || salesPerson.email || ''
            },
            $push: {
              followUps: {
                type: 'assignment',
                summary: `Lead assigned to ${salesPerson.teamMemberName || salesPerson.name}`,
                notes: stats.notes || `Bulk assigned via distribution algorithm`,
                date: new Date(),
                completed: false,
                assignedBy: req.user?.id || null
              }
            }
          }
        );
        
        totalAssigned += updateResult.modifiedCount;
        results.push({
          employeeId: employeeId,
          employeeName: salesPerson.teamMemberName || salesPerson.name,
          assignedCount: updateResult.modifiedCount,
          expectedCount: stats.leadIds.length
        });

        // Send assignment notification for each lead assigned to this employee
        for (const leadId of stats.leadIds) {
          await LeadLifecycleMessaging.sendAssignmentNotification(
            leadId, 
            salesPerson.teamMemberName || salesPerson.name || 'Support Team'
          );
        }
      } catch (error) {
        console.error(`Error processing assignments for employee ${employeeId}:`, error);
        continue;
      }
    }

    res.json({
      success: true,
      message: `${totalAssigned} leads assigned successfully across ${Object.keys(employeeStats).length} employees`,
      data: {
        totalAssigned,
        employeeAssignments: results,
        distributionSummary: results.map(r => `${r.employeeName}: ${r.assignedCount} leads`).join(', ')
      }
    });

  } catch (error) {
    console.error('Error in enhanced bulk assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk assignment',
      error: error.message
    });
  }
});

// Get leads assigned to a specific sales person
router.get('/assigned/:salesPersonId', async (req, res) => {
  try {
    const { salesPersonId } = req.params;
    
    const assignedLeads = await Lead.find({
      assignedTo: salesPersonId
    }).populate('assignedTo', 'name email role')
      .sort({ assignmentDate: -1 });

    res.json({
      success: true,
      data: assignedLeads
    });

  } catch (error) {
    console.error('Error fetching assigned leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned leads'
    });
  }
});

// Unassign lead (remove assignment)
router.put('/unassign/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    const { unassignmentNotes } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      {
        $unset: {
          assignedTo: 1,
          assignmentDate: 1,
          assignmentNotes: 1
        },
        $set: {
          lastContact: new Date()
        },
        $push: {
          followUps: {
            type: 'unassignment',
            summary: 'Lead unassigned',
            notes: unassignmentNotes || 'Lead unassigned and returned to pool',
            date: new Date(),
            completed: false,
            assignedBy: req.user?.id || null
          }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Lead unassigned successfully',
      data: updatedLead
    });

  } catch (error) {
    console.error('Error unassigning lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unassign lead'
    });
  }
});

// Get assignment statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: '$assignedTo',
          totalLeads: { $sum: 1 },
          newLeads: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          contactedLeads: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
          qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
          wonLeads: { $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] } },
          totalValue: { $sum: '$value' }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'salesPerson'
        }
      },
      {
        $unwind: {
          path: '$salesPerson',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          salesPersonName: { $ifNull: ['$salesPerson.name', 'Unassigned'] },
          salesPersonEmail: { $ifNull: ['$salesPerson.email', 'N/A'] },
          totalLeads: 1,
          newLeads: 1,
          contactedLeads: 1,
          qualifiedLeads: 1,
          wonLeads: 1,
          totalValue: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$totalLeads', 0] },
              { $multiply: [{ $divide: ['$wonLeads', '$totalLeads'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { totalLeads: -1 }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment statistics'
    });
  }
});

module.exports = router;
