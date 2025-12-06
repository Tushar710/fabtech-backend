const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// Get all departments with their employees
router.get('/departments-with-employees', async (req, res) => {
  try {
    const departments = await Department.find({})
      .populate({
        path: 'employees',
        select: 'name email role phone isActive',
        match: { isActive: { $ne: false } }
      })
      .sort({ name: 1 });

    // Also get employees by department reference
    const departmentsWithEmployees = await Promise.all(
      departments.map(async (dept) => {
        const employees = await Employee.find({
          department: dept._id,
          isActive: { $ne: false }
        }).select('name email role phone isActive');

        return {
          _id: dept._id,
          name: dept.name,
          description: dept.description,
          employees: employees,
          employeeCount: employees.length
        };
      })
    );

    res.json({
      success: true,
      data: departmentsWithEmployees
    });

  } catch (error) {
    console.error('Error fetching departments with employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments with employees'
    });
  }
});

// Get employees by specific department
router.get('/department/:departmentId/employees', async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Validate department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get employees in this department
    const employees = await Employee.find({
      department: departmentId,
      isActive: { $ne: false }
    }).select('name email role phone isActive')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        department: department,
        employees: employees,
        employeeCount: employees.length
      }
    });

  } catch (error) {
    console.error('Error fetching department employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department employees'
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
    
    // Get company-specific departments
    const allDepartments = await Department.find({ company: companyId }).lean();
    console.log(`📊 Found ${allDepartments.length} departments for company ${companyId}`);
    
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
        phone: emp.emergencyMobileNumber || 'No phone',
        isActive: true
      }))
    };
    
    console.log(`✅ Created department group with ${validEmployees.length} employees`);

    // If no valid employees found, provide sample data
    if (validEmployees.length === 0) {
      const sampleData = {
        'Sales Department': {
          department: { 
            _id: new mongoose.Types.ObjectId(),
            name: 'Sales Department',
            description: 'Sales and business development'
          },
          employees: [
            {
              _id: new mongoose.Types.ObjectId(),
              name: 'John Smith',
              email: 'john.smith@crm.com',
              role: 'sales_rep',
              phone: '9876543210',
              isActive: true
            },
            {
              _id: new mongoose.Types.ObjectId(),
              name: 'Sarah Johnson',
              email: 'sarah.johnson@crm.com',
              role: 'sales_manager',
              phone: '9876543211',
              isActive: true
            }
          ]
        },
        'Marketing Department': {
          department: { 
            _id: new mongoose.Types.ObjectId(),
            name: 'Marketing Department',
            description: 'Marketing and advertising'
          },
          employees: [
            {
              _id: new mongoose.Types.ObjectId(),
              name: 'Mike Wilson',
              email: 'mike.wilson@crm.com',
              role: 'marketing',
              phone: '9876543212',
              isActive: true
            }
          ]
        }
      };

      return res.json({
        success: true,
        data: {
          departments: Object.values(sampleData),
          allEmployees: Object.values(sampleData).flatMap(dept => dept.employees),
          totalEmployees: Object.values(sampleData).reduce((sum, dept) => sum + dept.employees.length, 0)
        },
        message: 'Using sample sales team data'
      });
    }

    res.json({
      success: true,
      data: {
        departments: Object.values(departmentGroups),
        allEmployees: validEmployees.map(emp => ({
          _id: emp._id,
          name: emp.teamMemberName,
          email: emp.teamMemberEmail || emp.email || 'No email',
          role: emp.role || 'Employee',
          phone: emp.emergencyMobileNumber || 'No phone',
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

// Create sample employees in existing departments
router.post('/create-sample-employees', async (req, res) => {
  try {
    // Get existing departments
    const departments = await Department.find({});
    
    if (departments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No departments found. Please create departments first.'
      });
    }

    // Find sales or marketing department
    let salesDept = departments.find(dept => 
      dept.name.toLowerCase().includes('sales') || 
      dept.name.toLowerCase().includes('marketing')
    );

    // If no sales department, use first department
    if (!salesDept) {
      salesDept = departments[0];
    }

    const sampleEmployees = [
      {
        name: 'John Smith',
        email: 'john.smith@crm.com',
        role: 'sales_rep',
        department: salesDept._id,
        phone: '9876543210',
        isActive: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@crm.com',
        role: 'sales_manager',
        department: salesDept._id,
        phone: '9876543211',
        isActive: true
      },
      {
        name: 'Mike Wilson',
        email: 'mike.wilson@crm.com',
        role: 'sales_rep',
        department: salesDept._id,
        phone: '9876543212',
        isActive: true
      }
    ];

    // Check if employees already exist
    const existingEmails = await Employee.find({
      email: { $in: sampleEmployees.map(emp => emp.email) }
    }).select('email');

    const existingEmailSet = new Set(existingEmails.map(emp => emp.email));
    const newEmployees = sampleEmployees.filter(emp => !existingEmailSet.has(emp.email));

    if (newEmployees.length === 0) {
      return res.json({
        success: true,
        message: 'Sample employees already exist',
        data: []
      });
    }

    const createdEmployees = await Employee.insertMany(newEmployees);

    res.json({
      success: true,
      message: `Created ${createdEmployees.length} sample employees`,
      data: createdEmployees
    });

  } catch (error) {
    console.error('Error creating sample employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sample employees'
    });
  }
});

module.exports = router;
