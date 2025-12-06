const mongoose = require('mongoose');

// Show current database structure being used for employee data fetching
async function showCurrentDatabaseStructure() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/crm-lead-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const companyId = '68babac58ab96e9658ba62a0';
    console.log('🔍 Company ID:', companyId);

    // Get all employees for this company
    console.log('\n📋 Current Database Structure for Employee Data:');
    const employees = await mongoose.connection.db.collection('employees')
      .find({ company: companyId })
      .toArray();

    console.log(`📊 Total employees found: ${employees.length}`);

    if (employees.length > 0) {
      console.log('\n🏗️ CURRENT STRUCTURE BEING FETCHED:');
      console.log('=====================================');
      
      employees.forEach((emp, index) => {
        console.log(`\n👤 Employee ${index + 1}: ${emp.teamMemberName}`);
        console.log('Structure:');
        console.log(`{`);
        console.log(`  "_id": "${emp._id}",`);
        console.log(`  "company": "${emp.company}" (${typeof emp.company}),`);
        console.log(`  "teamMemberName": "${emp.teamMemberName}",`);
        console.log(`  "teamMemberEmail": "${emp.teamMemberEmail || 'N/A'}",`);
        console.log(`  "mobileNumber": "${emp.mobileNumber || 'N/A'}",`);
        console.log(`  "emergencyMobileNumber": "${emp.emergencyMobileNumber || 'N/A'}",`);
        console.log(`  "email": "${emp.email}",`);
        console.log(`  "role": "${emp.role}",`);
        console.log(`  "salary": "${emp.salary || 'N/A'}",`);
        console.log(`  "department": ${JSON.stringify(emp.department || [])},`);
        console.log(`  "designation": ${JSON.stringify(emp.designation || [])},`);
        console.log(`  "weeklyHoliday": ${JSON.stringify(emp.weeklyHoliday || [])},`);
        console.log(`  "accessPermissions": ${JSON.stringify(emp.accessPermissions || [])},`);
        console.log(`  "creditPoints": ${emp.creditPoints || 0},`);
        console.log(`  "profileImage": "${emp.profileImage || 'N/A'}",`);
        console.log(`  "adharImage": "${emp.adharImage || 'N/A'}",`);
        console.log(`  "panImage": "${emp.panImage || 'N/A'}",`);
        console.log(`  "paidLeaves": ${JSON.stringify(emp.paidLeaves || [])},`);
        console.log(`  "documents": ${JSON.stringify(emp.documents || [])},`);
        console.log(`  "shift": "${emp.shift || 'N/A'}",`);
        console.log(`  "dateOfJoining": "${emp.dateOfJoining || 'N/A'}",`);
        console.log(`  "aadharNumber": "${emp.aadharNumber || 'N/A'}",`);
        console.log(`  "panNumber": "${emp.panNumber || 'N/A'}",`);
        console.log(`  "userUpi": "${emp.userUpi || 'N/A'}",`);
        console.log(`  "address": "${emp.address || 'N/A'}",`);
        console.log(`  "createdAt": "${emp.createdAt}",`);
        console.log(`  "updatedAt": "${emp.updatedAt}"`);
        console.log(`}`);
      });

      // Show field types analysis
      console.log('\n📊 FIELD TYPES ANALYSIS:');
      console.log('========================');
      const sampleEmp = employees[0];
      Object.keys(sampleEmp).forEach(key => {
        const value = sampleEmp[key];
        const type = Array.isArray(value) ? `Array[${value.length}]` : typeof value;
        console.log(`${key}: ${type}`);
      });

      // Show what API endpoint returns
      console.log('\n🔌 API ENDPOINT STRUCTURE:');
      console.log('==========================');
      console.log('GET /api/employee/company/68babac58ab96e9658ba62a0');
      console.log('Returns:');
      console.log(`{
  "success": true,
  "data": [
    {
      "_id": "${employees[0]._id}",
      "company": "${employees[0].company}",
      "teamMemberName": "${employees[0].teamMemberName}",
      "email": "${employees[0].email}",
      "role": "${employees[0].role}",
      "mobileNumber": "${employees[0].mobileNumber || 'N/A'}",
      "department": ${JSON.stringify(employees[0].department || [])},
      "designation": ${JSON.stringify(employees[0].designation || [])},
      "accessPermissions": ${JSON.stringify(employees[0].accessPermissions || [])},
      "creditPoints": ${employees[0].creditPoints || 0}
      // ... all other fields
    }
  ]
}`);

    } else {
      console.log('❌ No employees found for this company ID');
    }

    // Show all unique company IDs in database
    console.log('\n🏢 ALL COMPANY IDs IN DATABASE:');
    console.log('===============================');
    const allEmployees = await mongoose.connection.db.collection('employees').find({}).toArray();
    const uniqueCompanies = [...new Set(allEmployees.map(emp => emp.company))];
    uniqueCompanies.forEach(companyId => {
      const count = allEmployees.filter(emp => emp.company === companyId).length;
      console.log(`- ${companyId} (${count} employees)`);
    });

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
showCurrentDatabaseStructure();
