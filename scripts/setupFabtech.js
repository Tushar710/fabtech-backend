const mongoose = require('mongoose');
const Company = require('../models/Company');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
require('dotenv').config();

// Setup FABTECH company with default departments and admin user
async function setupFabtechCompany() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Check if FABTECH company already exists
    const existingCompany = await Company.findOne({ companyCode: 'FABTECH' });
    
    if (existingCompany) {
      console.log('⚠️ FABTECH company already exists');
      return existingCompany;
    }

    // Create FABTECH company
    const fabtechCompany = new Company({
      companyCode: 'FABTECH',
      password: 'fabtech123', // Default password - should be changed
      businessName: 'Fabtech Industries',
      businessEmail: 'admin@fabtech.com',
      businessPhone: '+91-9876543210',
      businessAddress: 'Industrial Area, New Delhi, India',
      businessCategory: 'Manufacturing',
      databaseName: 'fabtech_db',
      isActive: true
    });

    await fabtechCompany.save();
    console.log('✅ FABTECH company created successfully');

    // Create default departments
    const departments = [
      {
        name: 'Sales & Marketing',
        description: 'Handle sales activities and marketing campaigns',
        company: fabtechCompany._id
      },
      {
        name: 'Production',
        description: 'Manufacturing and production operations',
        company: fabtechCompany._id
      },
      {
        name: 'Quality Control',
        description: 'Quality assurance and testing',
        company: fabtechCompany._id
      },
      {
        name: 'Administration',
        description: 'Administrative and HR functions',
        company: fabtechCompany._id
      },
      {
        name: 'Technical Support',
        description: 'Customer support and technical assistance',
        company: fabtechCompany._id
      }
    ];

    const createdDepartments = await Department.insertMany(departments);
    console.log('✅ Default departments created');

    // Create admin employee
    const adminDepartment = createdDepartments.find(dept => dept.name === 'Administration');
    
    const adminEmployee = new Employee({
      company: fabtechCompany._id,
      department: adminDepartment._id,
      teamMemberName: 'Admin User',
      teamMemberEmail: 'admin@fabtech.com',
      email: 'admin@fabtech.com',
      password: 'admin123', // Default password - should be changed
      mobileNumber: '+91-9876543210',
      role: 'Admin',
      designation: 'System Administrator',
      employeeId: 'FAB001',
      dateOfJoining: new Date(),
      isActive: true
    });

    await adminEmployee.save();
    console.log('✅ Admin employee created');

    console.log('\n🎉 FABTECH company setup completed!');
    console.log('📋 Company Details:');
    console.log(`   Company Code: ${fabtechCompany.companyCode}`);
    console.log(`   Password: fabtech123`);
    console.log(`   Business Name: ${fabtechCompany.businessName}`);
    console.log(`   Admin Email: ${adminEmployee.email}`);
    console.log(`   Admin Password: admin123`);
    console.log('\n⚠️ Please change default passwords after first login!');

    return fabtechCompany;

  } catch (error) {
    console.error('❌ Error setting up FABTECH company:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupFabtechCompany()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupFabtechCompany;
