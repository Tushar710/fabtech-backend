const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Superadmin = require('../models/Superadmin');
const Employee = require('../models/Employee');

// Check if we need to connect to existing superadmins collection
const checkExistingSuperadmins = async () => {
  try {
    // Check if superadmins collection exists in the database
    const mongoose = require('mongoose');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const superadminCollection = collections.find(col => col.name === 'superadmins');
    
    if (superadminCollection) {
      console.log('✅ Found existing superadmins collection');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error checking superadmins collection:', error);
    return false;
  }
};

// Initialize demo users if they don't exist
const initializeDemoUsers = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@crm.com' });
    const salesExists = await User.findOne({ email: 'sales@crm.com' });
    
    if (!adminExists) {
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@crm.com',
        password: 'admin123',
        userType: 'admin',
        role: 'admin',
        permissions: ['create_lead', 'edit_lead', 'delete_lead', 'view_all_leads', 'manage_team', 'manage_users']
      });
      await adminUser.save();
      console.log('✅ Admin user created');
    }
    
    if (!salesExists) {
      const salesUser = new User({
        name: 'Sales User',
        email: 'sales@crm.com',
        password: 'sales123',
        userType: 'sales',
        role: 'sales_rep',
        permissions: ['create_lead', 'edit_lead', 'view_all_leads']
      });
      await salesUser.save();
      console.log('✅ Sales user created');
    }
  } catch (error) {
    console.error('❌ Error initializing demo users:', error);
  }
};

// Initialize demo users on module load
initializeDemoUsers();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    
    console.log('🔐 Login attempt:', { email, userType });
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user in User collection first
    let user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    let foundUserType = 'user';
    
    // If not found in User collection, check Superadmin collection
    if (!user) {
      user = await Superadmin.findOne({ email: email.toLowerCase() });
      foundUserType = 'superadmin';
    }
    
    // If not found in both, check Employee collection
    if (!user) {
      console.log('🔍 Checking employees collection for:', email);
      
      // Use direct MongoDB query to avoid ObjectId issues
      const mongoose = require('mongoose');
      const db = mongoose.connection.db;
      
      // First, let's find employee by email
      const employeeData = await db.collection('employees').findOne({ 
        email: email.toLowerCase()
      });
      
      console.log('🔍 Employee data found:', employeeData ? 'Yes' : 'No');
      
      if (employeeData) {
        // For employees, we'll use simple password '123'
        const employeePassword = '123';
        
        user = {
          _id: employeeData._id,
          email: employeeData.email,
          password: employeePassword,
          teamMemberName: employeeData.name,
          role: employeeData.role,
          emergencyMobileNumber: employeeData.phone,
          comparePassword: async function(inputPassword) {
            console.log('🔍 Comparing passwords:', { input: inputPassword, stored: this.password });
            // For employees, password is always '123'
            const isValid = inputPassword === '123';
            console.log('🔍 Password comparison result:', isValid);
            return isValid;
          }
        };
        foundUserType = 'employee';
        console.log('🔍 Employee user created for:', user.teamMemberName);
      }
    }
    
    if (!user) {
      console.log('❌ User not found in any collection:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Update last login (only for User collection, not Superadmin)
    if (foundUserType === 'user') {
      user.lastLogin = new Date();
      await user.save();
    }
    
    // Prepare user data based on collection type
    let userData;
    if (foundUserType === 'superadmin') {
      userData = {
        id: user._id,
        name: user.firstName || user.name,
        email: user.email,
        userType: 'superadmin',
        role: 'superadmin',
        permissions: ['create_lead', 'edit_lead', 'delete_lead', 'view_all_leads', 'manage_team', 'manage_users'],
        phone: user.phoneNumber
      };
    } else if (foundUserType === 'employee') {
      userData = {
        id: user._id,
        name: user.teamMemberName,
        email: user.email,
        userType: 'employee',
        role: user.role || 'Employee',
        permissions: ['view_assigned_leads', 'update_lead_status', 'add_follow_up', 'view_notifications'],
        phone: user.emergencyMobileNumber
      };
    } else {
      userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        role: user.role,
        permissions: user.permissions,
        profile: user.profile
      };
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        userType: userData.userType,
        role: userData.role,
        permissions: userData.permissions
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    console.log('✅ Login successful for:', email, 'as', foundUserType);
    
    res.json({
      message: 'Login successful',
      token,
      accessToken: token, // For compatibility with frontend
      user: userData
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Register superadmin route
router.post('/register-superadmin', async (req, res) => {
  try {
    const { name, email, password, userType, role } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create new superadmin user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      userType: 'superadmin',
      role: 'superadmin',
      permissions: ['create_lead', 'edit_lead', 'delete_lead', 'view_all_leads', 'manage_team', 'manage_users']
    });
    
    await newUser.save();
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: newUser._id, 
        email: newUser.email, 
        userType: newUser.userType,
        role: newUser.role,
        permissions: newUser.permissions
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      message: 'Superadmin registered successfully',
      token,
      accessToken: token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        userType: newUser.userType,
        role: newUser.role,
        permissions: newUser.permissions
      }
    });
    
  } catch (error) {
    console.error('Superadmin registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, userType, role } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create new user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      userType: userType || 'employee',
      role: role || 'sales_rep',
      permissions: ['create_lead', 'edit_lead']
    });
    
    await newUser.save();
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: newUser._id, 
        email: newUser.email, 
        userType: newUser.userType,
        role: newUser.role,
        permissions: newUser.permissions
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      accessToken: token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        userType: newUser.userType,
        role: newUser.role,
        permissions: newUser.permissions
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Employee login route
router.post('/employee-login', async (req, res) => {
  try {
    const { email, password, employeeId } = req.body;

    console.log('🔐 Employee login attempt:', { email, employeeId });

    let employee;
    
    // Find employee by email or employeeId (without populate to avoid schema issues)
    if (employeeId) {
      employee = await Employee.findOne({ employeeId });
    } else if (email) {
      // Try both email fields for compatibility
      employee = await Employee.findOne({ 
        $or: [
          { email: email.toLowerCase() },
          { teamMemberEmail: email.toLowerCase() }
        ]
      });
      
      // If not found, try to find the newly created employee
      if (!employee) {
        employee = await Employee.findOne({ email: email.toLowerCase() });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Email or Employee ID is required' 
      });
    }

    if (!employee) {
      console.log('❌ Employee not found for email:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    console.log('✅ Employee found:', {
      id: employee._id,
      name: employee.teamMemberName,
      email: employee.email,
      password: employee.password,
      company: employee.company,
      department: employee.department
    });

    // Check if employee is active
    if (!employee.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Employee account is deactivated' 
      });
    }

    // Verify password - check both hashed and plain text for compatibility
    let isPasswordValid = false;
    
    console.log('🔍 Password verification:', {
      inputPassword: password,
      storedPassword: employee.password,
      passwordsMatch: password === employee.password
    });
    
    // First check if password is plain text match
    if (password === employee.password) {
      isPasswordValid = true;
      console.log('🔍 Plain text password match: SUCCESS');
    } else {
      // Try bcrypt comparison for hashed passwords
      try {
        isPasswordValid = await bcrypt.compare(password, employee.password);
        console.log('🔍 Bcrypt comparison result:', isPasswordValid);
      } catch (error) {
        console.log('🔍 Bcrypt failed, password does not match');
        isPasswordValid = false;
      }
    }
    
    // Also check for default password '123'
    if (!isPasswordValid && password === '123') {
      isPasswordValid = true;
      console.log('🔍 Default password 123 accepted');
    }
    
    if (!isPasswordValid) {
      console.log('❌ Password validation failed for employee:', email);
      console.log('❌ Tried password:', password);
      console.log('❌ Stored password:', employee.password);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    console.log('✅ Password validation successful');

    // Generate JWT token
    // Use the actual employee ID from database
    const actualEmployeeId = employee._id.toString();
    
    const token = jwt.sign({
      id: actualEmployeeId,  // Add id field with employee ID
      employeeId: actualEmployeeId,
      email: employee.email,
      companyId: employee.company,
      departmentId: employee.department,
      role: 'employee',  // Lowercase for consistency
      type: 'employee'
    }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    // Update last login
    employee.lastLogin = new Date();
    await employee.save();

    res.json({
      success: true,
      message: 'Employee login successful',
      token,
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.teamMemberName || employee.name,
        email: employee.email,
        role: employee.role,
        designation: employee.designation,
        company: employee.company ? {
          id: employee.company._id || employee.company,
          name: employee.company.name || 'FABTECH',
          companyCode: employee.company.companyCode || 'FABTECH'
        } : null,
        department: employee.department ? {
          id: employee.department._id || employee.department,
          name: employee.department.name || 'Sales'
        } : null,
        permissions: employee.permissions,
        lastLogin: employee.lastLogin
      }
    });

  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
