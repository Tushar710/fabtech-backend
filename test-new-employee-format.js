const mongoose = require('mongoose');
const Employee = require('./models/Employee');

// Test script to fetch employees with the new format
async function testNewEmployeeFormat() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/crm-lead-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Test company ID
    const companyId = '68babac58ab96e9658ba62a0';
    console.log('🔍 Testing with company ID:', companyId);

    // Query employees with string company field (new format)
    console.log('\n📋 Fetching employees with new format (company as string)');
    const employees = await Employee.find({ company: companyId });
    
    console.log(`📊 Found ${employees.length} employees`);
    
    employees.forEach((emp, index) => {
      console.log(`\n👤 Employee ${index + 1}:`);
      console.log(`- Name: ${emp.teamMemberName}`);
      console.log(`- Email: ${emp.email}`);
      console.log(`- Mobile: ${emp.mobileNumber || emp.emergencyMobileNumber}`);
      console.log(`- Role: ${emp.role}`);
      console.log(`- Company: ${emp.company} (Type: ${typeof emp.company})`);
      console.log(`- Department: ${JSON.stringify(emp.department)}`);
      console.log(`- Designation: ${JSON.stringify(emp.designation)}`);
      console.log(`- Weekly Holiday: ${JSON.stringify(emp.weeklyHoliday)}`);
      console.log(`- Access Permissions: ${JSON.stringify(emp.accessPermissions)}`);
      console.log(`- Credit Points: ${emp.creditPoints}`);
      
      if (emp.profileImage) {
        console.log(`- Profile Image: ${emp.profileImage}`);
      }
      if (emp.adharImage) {
        console.log(`- Aadhar Image: ${emp.adharImage}`);
      }
      if (emp.panImage) {
        console.log(`- PAN Image: ${emp.panImage}`);
      }
      if (emp.paidLeaves && emp.paidLeaves.length > 0) {
        console.log(`- Paid Leaves: ${JSON.stringify(emp.paidLeaves)}`);
      }
    });

    // Test raw MongoDB query to see actual data structure
    console.log('\n📋 Raw MongoDB data structure:');
    const rawEmployees = await mongoose.connection.db.collection('employees')
      .find({ company: companyId })
      .limit(1)
      .toArray();
    
    if (rawEmployees.length > 0) {
      console.log('Raw employee data:');
      console.log(JSON.stringify(rawEmployees[0], null, 2));
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testNewEmployeeFormat();
