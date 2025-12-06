const mongoose = require('mongoose');
const Employee = require('./models/Employee');

// Test script to fetch employees by company ID
async function testCompanyEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/crm-lead-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Test company ID in the format provided
    const testCompanyId = '68babac58ab96e9658ba62a0';
    console.log('🔍 Testing with company ID:', testCompanyId);

    // Method 1: Direct string match
    console.log('\n📋 Method 1: Direct string match');
    const employees1 = await Employee.find({ company: testCompanyId });
    console.log(`Found ${employees1.length} employees with direct string match`);
    employees1.forEach(emp => {
      console.log(`- ${emp.teamMemberName} (${emp.teamMemberEmail}) - Company: ${emp.company}`);
    });

    // Method 2: ObjectId conversion
    console.log('\n📋 Method 2: ObjectId conversion');
    let employees2 = [];
    try {
      const objectId = new mongoose.Types.ObjectId(testCompanyId);
      employees2 = await Employee.find({ company: objectId });
      console.log(`Found ${employees2.length} employees with ObjectId conversion`);
      employees2.forEach(emp => {
        console.log(`- ${emp.teamMemberName} (${emp.teamMemberEmail}) - Company: ${emp.company}`);
      });
    } catch (err) {
      console.log('❌ Invalid ObjectId format:', err.message);
    }

    // Method 3: Combined query (OR condition)
    console.log('\n📋 Method 3: Combined OR query');
    const query = {
      $or: [
        { company: testCompanyId },
        { company: new mongoose.Types.ObjectId(testCompanyId) }
      ]
    };
    const employees3 = await Employee.find(query);
    console.log(`Found ${employees3.length} employees with OR query`);
    employees3.forEach(emp => {
      console.log(`- ${emp.teamMemberName} (${emp.teamMemberEmail}) - Company: ${emp.company}`);
    });

    // Method 4: Check all employees and their company formats
    console.log('\n📋 Method 4: All employees with company data');
    const allEmployees = await Employee.find({}).limit(10);
    console.log(`Total employees in database: ${allEmployees.length}`);
    allEmployees.forEach(emp => {
      console.log(`- ${emp.teamMemberName} - Company: ${emp.company} (Type: ${typeof emp.company})`);
    });

    // Method 5: Find unique company IDs
    console.log('\n📋 Method 5: Unique company IDs in database');
    const uniqueCompanies = await Employee.distinct('company');
    console.log('Unique company IDs found:');
    uniqueCompanies.forEach(companyId => {
      console.log(`- ${companyId} (Type: ${typeof companyId})`);
    });

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testCompanyEmployees();
