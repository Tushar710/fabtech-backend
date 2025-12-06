const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const { validationResult, body } = require('express-validator');
const auth = require('../middleware/auth');

// Get all departments (company-specific)
router.get('/', auth, async (req, res) => {
  try {
    console.log('🔍 Fetching departments for company:', req.companyId);
    
    let query = {};
    if (req.companyId) {
      query.company = req.companyId;
    }
    
    const departments = await Department.find(query)
      .populate('company', 'businessName')
      .sort({ name: 1 });

    console.log(`📊 Found ${departments.length} departments for company ${req.companyId}`);
    res.json({
      success: true,
      data: departments
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments'
    });
  }
});

// Get sales departments and their employees
router.get('/sales-departments', async (req, res) => {
  try {
    console.log('🔍 Fetching sales departments and employees...');
    
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    let companyId;
    
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      console.log('🔍 Decoded token in sales-departments route:', decoded);
      
      if (decoded?.role === 'company') {
        companyId = decoded.id;
        console.log('✅ Company ID extracted from token:', companyId);
      }
    }
    
    if (!companyId) {
      console.log('❌ No company ID found - returning empty response');
      return res.json({
        success: true,
        data: {
          departments: [],
          allEmployees: [],
          totalEmployees: 0
        },
        message: 'No company context found'
      });
    }
    
    // Get company-specific employees
    const allEmployees = await Employee.find({ 
      company: companyId,
      isActive: { $ne: false }
    }).lean();
    console.log(`👥 Found ${allEmployees.length} employees for company ${companyId}`);
    
    // Filter employees who have valid names
    const validEmployees = allEmployees.filter(emp => 
      emp.teamMemberName && emp.teamMemberName.trim() !== ''
    );

    // Create department groups with all employees
    const departmentGroups = {};
    
    // Add "All Employees" group with all valid employees
    departmentGroups['All Employees'] = {
      department: {
        _id: 'all-employees',
        name: 'All Employees',
        description: 'All available employees for assignment'
      },
      employees: validEmployees.map(emp => ({
        _id: emp._id,
        name: emp.teamMemberName,
        email: emp.teamMemberEmail || emp.email || 'No email',
        role: emp.role || 'Employee',
        phone: emp.mobileNumber || emp.emergencyMobileNumber || 'No phone',
        isActive: true
      }))
    };
    
    console.log(`✅ Created department group with ${validEmployees.length} employees`);

    return res.json({
      success: true,
      data: {
        departments: Object.values(departmentGroups),
        allEmployees: validEmployees.map(emp => ({
          _id: emp._id,
          name: emp.teamMemberName,
          email: emp.teamMemberEmail || emp.email || 'No email',
          role: emp.role || 'Employee',
          phone: emp.mobileNumber || emp.emergencyMobileNumber || 'No phone',
          isActive: true
        })),
        totalEmployees: validEmployees.length
      },
      message: `Found ${validEmployees.length} employees from database`
    });

  } catch (error) {
    console.error('Error fetching sales departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales departments'
    });
  }
});

// Get departments by company
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    const departments = await Department.find({ company: companyId })
      .populate('company', 'businessName')
      .sort({ name: 1 });

    console.log(`📊 Found ${departments.length} departments for company ${companyId}`);
    res.json({
      success: true,
      data: departments
    });

  } catch (error) {
    console.error('Error fetching company departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company departments'
    });
  }
});

// Get department by ID with employee count
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    const department = await Department.findById(id)
      .populate('company', 'businessName');
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get employee count for this department
    const employeeCount = await Employee.countDocuments({ department: id });

    const departmentWithCount = {
      ...department.toObject(),
      employeeCount
    };

    res.json({
      success: true,
      data: departmentWithCount
    });

  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department'
    });
  }
});

// Create department
router.post('/', auth, [
  body('name').notEmpty().withMessage('Department name is required')
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
    const departmentData = {
      ...req.body,
      company: req.companyId
    };

    const department = new Department(departmentData);
    await department.save();

    const populatedDepartment = await Department.findById(department._id)
      .populate('company', 'businessName');

    console.log('✅ Department created:', department.name, 'for company:', req.companyId);
    res.status(201).json({
      success: true,
      data: populatedDepartment,
      message: 'Department created successfully'
    });

  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department'
    });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    const department = await Department.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('company', 'businessName');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    console.log('✅ Department updated:', department.name);
    res.json({
      success: true,
      data: department,
      message: 'Department updated successfully'
    });

  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department'
    });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    // Check if department has employees
    const employeeCount = await Employee.countDocuments({ department: id });
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. It has ${employeeCount} employees assigned.`
      });
    }

    const department = await Department.findByIdAndDelete(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    console.log('✅ Department deleted:', department.name);
    res.json({
      success: true,
      message: 'Department deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department'
    });
  }
});

// Get department statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get employee statistics
    const totalEmployees = await Employee.countDocuments({ department: id });
    const activeEmployees = await Employee.countDocuments({ 
      department: id, 
      isActive: { $ne: false } 
    });

    // Get role distribution
    const roleDistribution = await Employee.aggregate([
      { $match: { department: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const stats = {
      departmentName: department.name,
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      roleDistribution
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department statistics'
    });
  }
});

module.exports = router;
