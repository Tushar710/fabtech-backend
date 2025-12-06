const mongoose = require('mongoose');

// Check why API is missing employees that exist in database
async function checkWhyAPIMissingEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/crm-lead-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const companyId = '68babac58ab96e9658ba62a0';
    console.log('🔍 Company ID:', companyId);

    // Test the exact query that the API uses
    console.log('\n📋 TESTING API QUERY LOGIC:');
    
    // Query 1: String format (what API uses)
    const stringQuery = { company: companyId };
    const stringEmployees = await mongoose.connection.db.collection('employees')
      .find(stringQuery)
      .toArray();
    console.log(`📊 String query: ${stringEmployees.length} employees`);
    
    // Query 2: ObjectId format (what API uses)
    const objectIdQuery = { company: new mongoose.Types.ObjectId(companyId) };
    const objectIdEmployees = await mongoose.connection.db.collection('employees')
      .find(objectIdQuery)
      .toArray();
    console.log(`📊 ObjectId query: ${objectIdEmployees.length} employees`);
    
    // Query 3: Combined OR query (what API should use)
    const orQuery = {
      $or: [
        { company: companyId },
        { company: new mongoose.Types.ObjectId(companyId) }
      ]
    };
    const orEmployees = await mongoose.connection.db.collection('employees')
      .find(orQuery)
      .toArray();
    console.log(`📊 OR query: ${orEmployees.length} employees`);

    // Show details of each employee found
    console.log('\n👥 EMPLOYEES FOUND BY OR QUERY:');
    orEmployees.forEach((emp, index) => {
      console.log(`\n👤 Employee ${index + 1}: ${emp.teamMemberName}`);
      console.log(`- ID: ${emp._id}`);
      console.log(`- Company: ${emp.company} (${typeof emp.company})`);
      console.log(`- Email: ${emp.email}`);
      
      // Check format
      const hasNewFields = emp.mobileNumber || emp.designation || emp.userUpi;
      const hasOldFields = emp.teamMemberEmail || emp.employeeId;
      
      if (hasNewFields) {
        console.log(`- Format: NEW ✅`);
      } else if (hasOldFields) {
        console.log(`- Format: OLD ❌`);
      } else {
        console.log(`- Format: UNKNOWN`);
      }
    });

    // Check if there's a connection issue with the API
    console.log('\n🔌 CHECKING API CONNECTION:');
    const Employee = require('./models/Employee');
    
    // Test using Mongoose model (like API does)
    const mongooseEmployees = await Employee.find(orQuery);
    console.log(`📊 Mongoose query: ${mongooseEmployees.length} employees`);
    
    mongooseEmployees.forEach((emp, index) => {
      console.log(`\n👤 Mongoose Employee ${index + 1}: ${emp.teamMemberName}`);
      console.log(`- ID: ${emp._id}`);
      console.log(`- Company: ${emp.company}`);
      console.log(`- Has mobileNumber: ${emp.mobileNumber ? 'YES' : 'NO'}`);
      console.log(`- Has teamMemberEmail: ${emp.teamMemberEmail ? 'YES' : 'NO'}`);
    });

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
checkWhyAPIMissingEmployees();
