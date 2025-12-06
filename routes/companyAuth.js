const express = require('express');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const router = express.Router();

// Company Login
router.post('/login', async (req, res) => {
  try {
    const { companyCode, email, password } = req.body;

    if ((!companyCode && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email (or company code) and password are required'
      });
    }

    // Find company by email or code
    let query = { isActive: true };
    if (email) {
      query.businessEmail = email.toLowerCase();
    } else if (companyCode) {
      query.companyCode = companyCode.toUpperCase();
    }

    const company = await Company.findOne(query);

    if (!company) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/company code or company is inactive'
      });
    }

    // Check password
    const isValidPassword = await company.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: company._id.toString(),
        companyId: company._id.toString(),
        companyCode: company.companyCode,
        businessName: company.businessName,
        type: 'company'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      company: {
        id: company._id,
        companyCode: company.companyCode,
        businessName: company.businessName,
        businessEmail: company.businessEmail,
        businessPhone: company.businessPhone,
        businessLogo: company.businessLogo
      }
    });

  } catch (error) {
    console.error('Company login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get Company Dashboard Data
router.get('/dashboard', authenticateCompany, async (req, res) => {
  try {
    const companyId = req.company.companyId;

    // Get departments count
    const departmentsCount = await Department.countDocuments({ 
      company: companyId, 
      isActive: true 
    });

    // Get employees count
    const employeesCount = await Employee.countDocuments({ 
      company: companyId, 
      isActive: true 
    });

    // Get departments with employee counts
    const departments = await Department.aggregate([
      { $match: { company: companyId, isActive: true } },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: 'department',
          as: 'employees'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          employeeCount: { $size: '$employees' },
          createdAt: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        company: {
          name: req.company.businessName,
          code: req.company.companyCode
        },
        stats: {
          departments: departmentsCount,
          employees: employeesCount
        },
        departments
      }
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Company Authentication Middleware
function authenticateCompany(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.company = decoded;
    next();
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
}

// Update Company Profile
router.put('/profile', authenticateCompany, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const {
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      businessWebsite,
      businessCategory,
      gstNumber,
      panNumber
    } = req.body;

    // Check if email is being changed and if it's already taken
    if (businessEmail) {
      const existingCompany = await Company.findOne({
        businessEmail: businessEmail.toLowerCase(),
        _id: { $ne: companyId }
      });

      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another company'
        });
      }
    }

    // Update company profile
    const updateData = {};
    if (businessName) updateData.businessName = businessName;
    if (businessEmail) updateData.businessEmail = businessEmail.toLowerCase();
    if (businessPhone) updateData.businessPhone = businessPhone;
    if (businessAddress) updateData.businessAddress = JSON.stringify(businessAddress);
    if (businessWebsite) updateData.businessWebsite = businessWebsite;
    if (businessCategory) updateData.businessCategory = businessCategory;
    if (gstNumber) updateData.gstNumber = gstNumber;
    if (panNumber) updateData.panNumber = panNumber;

    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      company: {
        id: updatedCompany._id,
        companyCode: updatedCompany.companyCode,
        businessName: updatedCompany.businessName,
        businessEmail: updatedCompany.businessEmail,
        businessPhone: updatedCompany.businessPhone,
        businessAddress: updatedCompany.businessAddress,
        businessWebsite: updatedCompany.businessWebsite,
        businessCategory: updatedCompany.businessCategory,
        gstNumber: updatedCompany.gstNumber,
        panNumber: updatedCompany.panNumber
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// Change Company Password
router.put('/change-password', authenticateCompany, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Verify current password
    const isValidPassword = await company.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    company.password = newPassword;
    await company.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
});

// Get Company Profile
router.get('/profile', authenticateCompany, async (req, res) => {
  try {
    const companyId = req.company.companyId;

    const company = await Company.findById(companyId).select('-password');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      company: {
        id: company._id,
        companyCode: company.companyCode,
        businessName: company.businessName,
        businessEmail: company.businessEmail,
        businessPhone: company.businessPhone,
        businessAddress: company.businessAddress,
        businessWebsite: company.businessWebsite,
        businessCategory: company.businessCategory,
        businessLogo: company.businessLogo,
        gstNumber: company.gstNumber,
        panNumber: company.panNumber,
        isActive: company.isActive,
        createdAt: company.createdAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// Company registration route
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      companyCode,
      password,
      email,
      phone,
      address,
      website,
      gstNumber,
      panNumber,
      industry,
      employeeCount
    } = req.body;

    // Validate required fields
    if (!name || !companyCode || !password || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, company code, password, email, and phone are required'
      });
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({
      $or: [
        { companyCode: companyCode.toUpperCase() },
        { businessEmail: email.toLowerCase() }
      ]
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this code or email already exists'
      });
    }

    // Create new company
    const newCompany = new Company({
      businessName: name,
      companyCode: companyCode.toUpperCase(),
      password, // Will be hashed by the model
      businessEmail: email.toLowerCase(),
      businessPhone: phone,
      businessAddress: address ? JSON.stringify(address) : '',
      databaseName: `fabtech_${companyCode.toLowerCase()}`,
      businessCategory: industry,
      isActive: true
    });

    await newCompany.save();

    // Create default departments for the new company
    const defaultDepartments = [
      { name: 'Sales', description: 'Sales and Marketing Department' },
      { name: 'Operations', description: 'Operations Department' },
      { name: 'HR', description: 'Human Resources Department' },
      { name: 'Finance', description: 'Finance and Accounts Department' }
    ];

    const createdDepartments = [];
    for (const dept of defaultDepartments) {
      const department = new Department({
        name: dept.name,
        description: dept.description,
        company: newCompany._id,
        isActive: true
      });
      await department.save();
      createdDepartments.push(department);
    }

    // Create default admin employee
    const adminEmployee = new Employee({
      employeeId: `${companyCode.toUpperCase()}001`,
      teamMemberName: 'Admin User',
      email: `admin@${companyCode.toLowerCase()}.com`,
      password: 'admin123', // Will be hashed by the model
      mobileNumber: phone,
      company: newCompany._id,
      department: createdDepartments[0]._id, // Assign to Sales department
      role: 'Admin',
      designation: 'Administrator',
      isActive: true
    });

    await adminEmployee.save();

    res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      company: {
        id: newCompany._id,
        name: newCompany.businessName,
        companyCode: newCompany.companyCode,
        email: newCompany.businessEmail,
        phone: newCompany.businessPhone
      },
      departments: createdDepartments.map(dept => ({
        id: dept._id,
        name: dept.name,
        description: dept.description
      })),
      adminEmployee: {
        id: adminEmployee._id,
        employeeId: adminEmployee.employeeId,
        email: adminEmployee.email,
        defaultPassword: 'admin123'
      }
    });

  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Get company quotation settings
router.get('/quotation-settings', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const company = await Company.findById(decoded.companyId);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.json({
      success: true,
      data: company.quotationSettings || {}
    });
  } catch (error) {
    console.error('Error fetching quotation settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update company quotation settings
router.put('/quotation-settings', async (req, res) => {
  try {
    console.log('🔄 PUT /quotation-settings - Request received');
    console.log('📦 Request body:', req.body);
    console.log('🔑 Authorization header:', req.headers.authorization);
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    console.log('🔓 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token decoded:', { companyId: decoded.companyId });
    
    console.log('🔍 Finding company...');
    const company = await Company.findById(decoded.companyId);

    if (!company) {
      console.log('❌ Company not found for ID:', decoded.companyId);
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    console.log('✅ Company found:', company.businessName);
    console.log('📝 Updating quotation settings...');
    
    // Update quotation settings
    company.quotationSettings = req.body;
    await company.save();

    console.log('✅ Quotation settings updated successfully');

    res.json({
      success: true,
      message: 'Quotation settings updated successfully',
      data: company.quotationSettings
    });
  } catch (error) {
    console.error('❌ Error updating quotation settings:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

module.exports = router;
