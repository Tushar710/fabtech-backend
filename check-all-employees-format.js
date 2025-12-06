const mongoose = require('mongoose');

// Check all employees and their formats in the database
async function checkAllEmployeesFormat() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/crm-lead-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const companyId = '68babac58ab96e9658ba62a0';
    console.log('🔍 Company ID:', companyId);

    // Get ALL employees for this company from database
    console.log('\n📋 ALL EMPLOYEES IN DATABASE:');
    const allEmployees = await mongoose.connection.db.collection('employees')
      .find({ company: companyId })
      .toArray();

    console.log(`📊 Total employees found: ${allEmployees.length}`);

    allEmployees.forEach((emp, index) => {
      console.log(`\n👤 Employee ${index + 1}: ${emp.teamMemberName}`);
      console.log(`- ID: ${emp._id}`);
      console.log(`- Email: ${emp.email}`);
      console.log(`- Company: ${emp.company} (${typeof emp.company})`);
      
      // Check format type
      const hasNewFields = emp.mobileNumber || emp.designation || emp.userUpi || emp.profileImage;
      const hasOldFields = emp.teamMemberEmail || emp.employeeId;
      
      if (hasNewFields) {
        console.log(`- FORMAT: NEW ✅`);
        console.log(`  - mobileNumber: ${emp.mobileNumber || 'N/A'}`);
        console.log(`  - designation: ${JSON.stringify(emp.designation || [])}`);
        console.log(`  - userUpi: ${emp.userUpi || 'N/A'}`);
        console.log(`  - profileImage: ${emp.profileImage ? 'Yes' : 'No'}`);
      } else {
        console.log(`- FORMAT: OLD ❌`);
        console.log(`  - teamMemberEmail: ${emp.teamMemberEmail || 'N/A'}`);
        console.log(`  - employeeId: ${emp.employeeId || 'N/A'}`);
        console.log(`  - emergencyMobileNumber: ${emp.emergencyMobileNumber || 'N/A'}`);
      }
    });

    // Check what API endpoint is actually returning
    console.log('\n🔌 TESTING API ENDPOINT RESPONSE:');
    const axios = require('axios');
    try {
      const response = await axios.get(`http://localhost:5001/api/employee/company/${companyId}`);
      console.log('✅ API Response Status:', response.status);
      console.log('📊 API Employee Count:', response.data.data?.length || 0);
      
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((emp, index) => {
          console.log(`\n👤 API Employee ${index + 1}: ${emp.teamMemberName}`);
          console.log(`- ID: ${emp._id}`);
          console.log(`- Email: ${emp.email}`);
          console.log(`- Company: ${JSON.stringify(emp.company)}`);
          
          // Check if API is returning populated company object
          if (emp.company && typeof emp.company === 'object' && emp.company._id) {
            console.log(`- Company Format: POPULATED OBJECT (${emp.company._id})`);
          } else {
            console.log(`- Company Format: STRING (${emp.company})`);
          }
          
          // Check fields
          const hasNewFields = emp.mobileNumber || emp.designation || emp.userUpi;
          console.log(`- Has New Fields: ${hasNewFields ? 'YES' : 'NO'}`);
          console.log(`- teamMemberEmail: ${emp.teamMemberEmail || 'N/A'}`);
          console.log(`- mobileNumber: ${emp.mobileNumber || 'N/A'}`);
        });
      }
    } catch (apiError) {
      console.log('❌ API Error:', apiError.message);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
checkAllEmployeesFormat();
