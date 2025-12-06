const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { validationResult, body } = require('express-validator');
const auth = require('../middleware/auth');

// Create employee
router.post('/', auth, [
  body('teamMemberName').notEmpty().withMessage('Team member name is required'),
  body('teamMemberEmail').isEmail().withMessage('Valid team member email is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').notEmpty().withMessage('Role is required')
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
    const employeeData = {
      ...req.body,
      company: req.companyId
    };

    // Set isBranchAdmin flag if role is Branch Admin
    if (employeeData.role === 'Branch Admin') {
      employeeData.isBranchAdmin = true;
    }

    const employee = new Employee(employeeData);
    await employee.save();

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('company', 'businessName')
      .populate('department', 'name');

    console.log('✅ Employee created:', employee.teamMemberName, 'for company:', req.companyId);
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

// Get all employees (company-specific)
router.get('/', auth, async (req, res) => {
  try {
    console.log('🔍 Getting employees with company filtering...');
    console.log('🔍 Company ID from auth middleware:', req.companyId);
    
    // Use company ID from auth middleware
    const companyId = req.companyId;
    
    // If no company ID, return empty response
    if (!companyId) {
      console.log('❌ No company ID found - returning empty response');
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Filter by company ID - handle both ObjectId and string formats
    const query = { 
      company: companyId,
      isActive: { $ne: false }  // Only active employees
    };
    console.log('📋 Employee query filter:', query);
    
    // Get all employees for the company
    const employees = await Employee.find(query)
      .sort({ teamMemberName: 1 });

    console.log(`📊 Found ${employees.length} employees for company ${companyId}`);
    console.log('📋 Employee names:', employees.map(e => e.teamMemberName));
    res.json({
      success: true,
      data: employees
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees'
    });
  }
});

// Get employees by departments (company-specific with department filtering)
router.get('/by-departments', auth, async (req, res) => {
  try {
    console.log('🔍 Getting employees by departments...');
    console.log('🔍 Company ID from auth middleware:', req.companyId);
    
    // Use company ID from auth middleware
    const companyId = req.companyId;
    
    if (!companyId) {
      console.log('❌ No company ID found - returning empty response');
      return res.json({
        success: true,
        data: [],
        departments: []
      });
    }

    // Step 1: Get all departments for this company
    const Department = require('../models/Department');
    const departments = await Department.find({ company: companyId })
      .select('_id name description')
      .sort({ name: 1 });
    
    console.log(`📊 Found ${departments.length} departments for company ${companyId}`);
    
    if (departments.length === 0) {
      return res.json({
        success: true,
        data: [],
        departments: [],
        message: 'No departments found for this company'
      });
    }

    // Step 2: Get department IDs
    const departmentIds = departments.map(dept => dept._id);
    console.log('🏢 Department IDs:', departmentIds);

    // Step 3: Get employees in these departments + company filter
    const employeeQuery = {
      $and: [
        {
          $or: [
            { company: companyId },           // String format
            { company: new mongoose.Types.ObjectId(companyId) }  // ObjectId format
          ]
        },
        {
          department: { $in: departmentIds }  // Must be in company's departments
        }
      ]
    };
    
    console.log('📋 Employee query with department filter:', JSON.stringify(employeeQuery, null, 2));
    
    const employees = await Employee.find(employeeQuery)
      .populate('department', 'name description')
      .sort({ teamMemberName: 1 });

    console.log(`👥 Found ${employees.length} employees in company departments`);

    // Step 4: Group employees by department
    const employeesByDepartment = {};
    departments.forEach(dept => {
      employeesByDepartment[dept._id.toString()] = {
        department: dept,
        employees: []
      };
    });

    employees.forEach(emp => {
      if (emp.department && emp.department._id) {
        const deptId = emp.department._id.toString();
        if (employeesByDepartment[deptId]) {
          employeesByDepartment[deptId].employees.push(emp);
        }
      }
    });

    res.json({
      success: true,
      data: employees,
      departments: departments,
      employeesByDepartment: Object.values(employeesByDepartment),
      totalEmployees: employees.length,
      totalDepartments: departments.length
    });

  } catch (error) {
    console.error('Error fetching employees by departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees by departments'
    });
  }
});

// Get employee by ID (company-filtered)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    let query = { _id: id };
    
    // Filter by company if user is not superadmin
    if (req.companyId) {
      query.company = req.companyId;
    }

    const employee = await Employee.findOne(query)
      .populate('company', 'businessName')
      .populate('department', 'name');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee'
    });
  }
});

// Update employee (company-filtered)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    let query = { _id: id };
    
    // Filter by company if user is not superadmin
    if (req.companyId) {
      query.company = req.companyId;
    }

    const employee = await Employee.findOneAndUpdate(
      query,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('company', 'businessName')
     .populate('department', 'name');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    console.log('✅ Employee updated:', employee.teamMemberName);
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

// Delete employee (company-filtered)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    let query = { _id: id };
    
    // Filter by company if user is not superadmin
    if (req.companyId) {
      query.company = req.companyId;
    }

    const employee = await Employee.findOneAndDelete(query);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    console.log('✅ Employee deleted:', employee.teamMemberName);
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

// Get employees by company
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const employees = await Employee.find({ company: companyId })
      .populate('company', 'businessName')
      .populate('department', 'name')
      .sort({ teamMemberName: 1 });

    res.json({
      success: true,
      data: employees
    });

  } catch (error) {
    console.error('Error fetching company employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company employees'
    });
  }
});

// Create multiple sample sales employees
router.post('/create-sales-team', async (req, res) => {
  try {
    // Find Sales Department
    const salesDept = await Department.findOne({ 
      name: { $regex: /sales/i } 
    });

    if (!salesDept) {
      return res.status(400).json({
        success: false,
        message: 'Sales Department not found'
      });
    }

    // Create a default userId for sales employees
    const defaultUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    const salesEmployees = [
      {
        name: 'John Smith',
        email: 'john.smith@crm.com',
        role: 'sales_rep',
        department: salesDept._id,
        phone: '9876543210',
        isActive: true,
        userId: defaultUserId
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@crm.com',
        role: 'sales_manager',
        department: salesDept._id,
        phone: '9876543211',
        isActive: true,
        userId: defaultUserId
      },
      {
        name: 'David Wilson',
        email: 'david.wilson@crm.com',
        role: 'sales_rep',
        department: salesDept._id,
        phone: '9876543212',
        isActive: true,
        userId: defaultUserId
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa.anderson@crm.com',
        role: 'sales_rep',
        department: salesDept._id,
        phone: '9876543213',
        isActive: true,
        userId: defaultUserId
      }
    ];

    // Check if employees already exist
    const existingEmails = await Employee.find({
      email: { $in: salesEmployees.map(emp => emp.email) }
    }).select('email');

    const existingEmailSet = new Set(existingEmails.map(emp => emp.email));
    const newEmployees = salesEmployees.filter(emp => !existingEmailSet.has(emp.email));

    if (newEmployees.length === 0) {
      return res.json({
        success: true,
        message: 'Sales team already exists',
        data: []
      });
    }

    const createdEmployees = await Employee.insertMany(newEmployees);
    
    // Populate department info
    const populatedEmployees = await Employee.find({
      _id: { $in: createdEmployees.map(emp => emp._id) }
    }).populate('department', 'name description');

    res.json({
      success: true,
      message: `Created ${createdEmployees.length} sales team members`,
      data: populatedEmployees
    });

  } catch (error) {
    console.error('Error creating sales team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sales team'
    });
  }
});

module.exports = router;
