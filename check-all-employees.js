const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllEmployees() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');

    const Employee = require('./models/Employee');
    
    const employees = await Employee.find({});
    console.log('\n📊 Total employees:', employees.length);
    
    employees.forEach((emp, index) => {
      console.log(`\n${index + 1}. ${emp.teamMemberName || emp.name}`);
      console.log('   ID:', emp._id);
      console.log('   Email:', emp.email);
      console.log('   Company:', emp.company);
    });

    // Check for "Tushar" employees
    console.log('\n🔍 Searching for "Tushar" employees:');
    const tushars = await Employee.find({ 
      $or: [
        { teamMemberName: /tushar/i },
        { name: /tushar/i }
      ]
    });
    
    tushars.forEach((emp, index) => {
      console.log(`\n${index + 1}. ${emp.teamMemberName || emp.name}`);
      console.log('   ID:', emp._id);
      console.log('   Email:', emp.email);
      console.log('   Active:', emp.isActive);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllEmployees();
