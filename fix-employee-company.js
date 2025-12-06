const mongoose = require('mongoose');
require('dotenv').config();

async function fixEmployeeCompanyAssociation() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');
    
    const Employee = require('./models/Employee');
    const Company = require('./models/Company');
    
    // Find FABTECH company
    const fabtechCompany = await Company.findOne({ businessEmail: 'admin@fabtech.com' });
    if (!fabtechCompany) {
      console.log('❌ FABTECH company not found');
      return;
    }
    
    console.log('🏢 FABTECH Company ID:', fabtechCompany._id);
    
    // Update all employees to belong to FABTECH company
    const result = await Employee.updateMany(
      {}, // Update all employees
      { company: fabtechCompany._id }
    );
    
    console.log('✅ Updated', result.modifiedCount, 'employees with FABTECH company ID');
    
    // Verify the update
    const employeesWithCompany = await Employee.find({ company: fabtechCompany._id });
    console.log('📊 Now', employeesWithCompany.length, 'employees belong to FABTECH');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEmployeeCompanyAssociation();
