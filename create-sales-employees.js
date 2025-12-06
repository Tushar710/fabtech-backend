const mongoose = require('mongoose');
require('dotenv').config();

async function createSalesEmployees() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');
    
    const Employee = require('./models/Employee');
    const Company = require('./models/Company');
    const Department = require('./models/Department');
    
    // Find FABTECH company
    const fabtechCompany = await Company.findOne({ businessEmail: 'admin@fabtech.com' });
    if (!fabtechCompany) {
      console.log('❌ FABTECH company not found');
      return;
    }
    
    // Find or create Sales department
    let salesDept = await Department.findOne({ 
      company: fabtechCompany._id,
      name: { $regex: /sales/i }
    });
    
    if (!salesDept) {
      salesDept = new Department({
        company: fabtechCompany._id,
        name: 'Sales',
        description: 'Sales Department'
      });
      await salesDept.save();
      console.log('✅ Created Sales Department');
    }
    
    console.log('🏢 Sales Department ID:', salesDept._id);
    
    // Create sales employees
    const salesEmployees = [
      {
        company: fabtechCompany._id,
        department: salesDept._id,
        teamMemberName: 'Rahul Sharma',
        teamMemberEmail: 'rahul.sharma@fabtech.com',
        email: 'rahul.sharma@fabtech.com',
        password: 'sales123',
        mobileNumber: '9876543210',
        role: 'Sales Executive',
        designation: 'Senior Sales Executive',
        employeeId: 'SALES001',
        isActive: true
      },
      {
        company: fabtechCompany._id,
        department: salesDept._id,
        teamMemberName: 'Priya Patel',
        teamMemberEmail: 'priya.patel@fabtech.com',
        email: 'priya.patel@fabtech.com',
        password: 'sales123',
        mobileNumber: '9876543211',
        role: 'Sales Executive',
        designation: 'Sales Executive',
        employeeId: 'SALES002',
        isActive: true
      },
      {
        company: fabtechCompany._id,
        department: salesDept._id,
        teamMemberName: 'Amit Kumar',
        teamMemberEmail: 'amit.kumar@fabtech.com',
        email: 'amit.kumar@fabtech.com',
        password: 'sales123',
        mobileNumber: '9876543212',
        role: 'Manager',
        designation: 'Sales Manager',
        employeeId: 'SALES003',
        isActive: true
      },
      {
        company: fabtechCompany._id,
        department: salesDept._id,
        teamMemberName: 'Sneha Gupta',
        teamMemberEmail: 'sneha.gupta@fabtech.com',
        email: 'sneha.gupta@fabtech.com',
        password: 'sales123',
        mobileNumber: '9876543213',
        role: 'Team Lead',
        designation: 'Sales Team Lead',
        employeeId: 'SALES004',
        isActive: true
      }
    ];
    
    // Check for existing employees
    const existingEmails = await Employee.find({
      email: { $in: salesEmployees.map(emp => emp.email) }
    }).select('email');
    
    const existingEmailSet = new Set(existingEmails.map(emp => emp.email));
    const newEmployees = salesEmployees.filter(emp => !existingEmailSet.has(emp.email));
    
    if (newEmployees.length === 0) {
      console.log('✅ Sales employees already exist');
    } else {
      const created = await Employee.insertMany(newEmployees);
      console.log('✅ Created', created.length, 'new sales employees');
    }
    
    // Show all employees for this company
    const allEmployees = await Employee.find({ company: fabtechCompany._id })
      .select('teamMemberName email role designation')
      .sort({ teamMemberName: 1 });
    
    console.log('\n📊 All FABTECH Employees:');
    allEmployees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.teamMemberName} - ${emp.role} (${emp.email})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSalesEmployees();
