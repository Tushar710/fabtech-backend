const axios = require('axios');

// Test hosted auth API for employee data
async function testHostedEmployeeAPI() {
  try {
    console.log('🔍 Testing Hosted Auth API for Employee Data');
    console.log('=' .repeat(50));
    
    // First, login to get JWT token
    const loginResponse = await axios.post('https://crm-tkxn.onrender.com/api/login', {
      email: 'infoysh@gmail.com',
      password: '123'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('🏢 Logged in company:', user.businessName);
    console.log('🆔 Company ID:', user.companyId || user.id);
    
    // Test employees endpoint
    console.log('\n📊 Testing /employees endpoint...');
    
    try {
      const employeesResponse = await axios.get('https://crm-tkxn.onrender.com/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Employees API Response Status:', employeesResponse.status);
      console.log('📋 Employees Data:', employeesResponse.data);
      
      if (employeesResponse.data.data) {
        console.log(`👥 Found ${employeesResponse.data.data.length} employees`);
        employeesResponse.data.data.forEach((emp, index) => {
          console.log(`  ${index + 1}. ${emp.teamMemberName || emp.name} (${emp.role})`);
        });
      }
      
    } catch (empError) {
      console.log('❌ Employees API Error:', empError.response?.status, empError.response?.data);
    }
    
    // Test companies endpoint
    console.log('\n🏢 Testing /companies endpoint...');
    
    try {
      const companiesResponse = await axios.get('https://crm-tkxn.onrender.com/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Companies API Response Status:', companiesResponse.status);
      console.log('📋 Companies Data:', companiesResponse.data);
      
      if (companiesResponse.data.data) {
        console.log(`🏢 Found ${companiesResponse.data.data.length} companies`);
        companiesResponse.data.data.forEach((comp, index) => {
          console.log(`  ${index + 1}. ${comp.businessName} (${comp.businessEmail})`);
        });
      }
      
    } catch (compError) {
      console.log('❌ Companies API Error:', compError.response?.status, compError.response?.data);
    }
    
    console.log('\n💡 ANALYSIS:');
    console.log('If employees/companies return empty or error, the hosted API might not have these endpoints.');
    console.log('In that case, we need to use local backend for employee/company data.');
    
  } catch (error) {
    console.error('❌ Login Error:', error.response?.data || error.message);
  }
}

testHostedEmployeeAPI();
