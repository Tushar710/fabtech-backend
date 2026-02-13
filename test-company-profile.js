const axios = require('axios');

// Configuration
const BASE_URL = 'https://fabtech-backend.onrender.com/api';
let authToken = '';

// Test data
const testCompany = {
  companyCode: 'TEST001',
  name: 'Test Company',
  email: 'testcompany@example.com',
  password: 'test123',
  phone: '+91 9876543210',
  address: 'Test Address, Test City'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 0: Register Test Company (if not exists)
async function testRegisterCompany() {
  try {
    log('\n📝 Test 0: Register/Check Test Company', 'blue');

    // Try to login first to check if company exists
    try {
      const loginResponse = await axios.post(`${BASE_URL}/company-auth/login`, {
        email: testCompany.email,
        password: testCompany.password
      });

      if (loginResponse.data.success) {
        authToken = loginResponse.data.token;
        log('✅ Test company already exists and login successful', 'green');
        return true;
      }
    } catch (loginError) {
      // Company doesn't exist, create it
      log('ℹ️  Test company not found, creating new one...', 'yellow');

      const registerResponse = await axios.post(`${BASE_URL}/company-auth/register`, {
        name: testCompany.name,
        companyCode: testCompany.companyCode,
        email: testCompany.email,
        password: testCompany.password,
        phone: testCompany.phone,
        address: testCompany.address
      });

      if (registerResponse.data.success) {
        log('✅ Test company registered successfully', 'green');
        log(`Company Code: ${registerResponse.data.company.companyCode}`, 'yellow');

        // Now login with the new company
        const loginResponse = await axios.post(`${BASE_URL}/company-auth/login`, {
          email: testCompany.email,
          password: testCompany.password
        });

        if (loginResponse.data.success) {
          authToken = loginResponse.data.token;
          log('✅ Login successful with new company', 'green');
          return true;
        }
      }
    }
  } catch (error) {
    log(`❌ Register/Login failed: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
    return false;
  }
}

// Test 1: Company Login
async function testLogin() {
  try {
    log('\n📝 Test 1: Company Login', 'blue');
    const response = await axios.post(`${BASE_URL}/company-auth/login`, {
      email: testCompany.email,
      password: testCompany.password
    });

    if (response.data.success) {
      authToken = response.data.token;
      log('✅ Login successful', 'green');
      log(`Token: ${authToken.substring(0, 20)}...`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Login failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test 2: Get Company Profile
async function testGetProfile() {
  try {
    log('\n📝 Test 2: Get Company Profile', 'blue');
    const response = await axios.get(`${BASE_URL}/company-auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      log('✅ Profile fetched successfully', 'green');
      log('Company Details:', 'yellow');
      console.log(JSON.stringify(response.data.company, null, 2));
      return true;
    }
  } catch (error) {
    log(`❌ Get profile failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test 3: Update Company Profile
async function testUpdateProfile() {
  try {
    log('\n📝 Test 3: Update Company Profile', 'blue');
    const response = await axios.put(`${BASE_URL}/company-auth/profile`, {
      businessName: 'Updated Company Name',
      businessPhone: '+91 9876543210',
      businessWebsite: 'https://www.updatedcompany.com',
      businessCategory: 'IT Services',
      gstNumber: '27AOZPK6478B1ZB',
      panNumber: 'AOZPK6478B'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      log('✅ Profile updated successfully', 'green');
      log('Updated Company Details:', 'yellow');
      console.log(JSON.stringify(response.data.company, null, 2));
      return true;
    }
  } catch (error) {
    log(`❌ Update profile failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test 4: Change Password (with wrong current password)
async function testChangePasswordWrong() {
  try {
    log('\n📝 Test 4: Change Password (Wrong Current Password)', 'blue');
    const response = await axios.put(`${BASE_URL}/company-auth/change-password`, {
      currentPassword: 'wrongpassword',
      newPassword: 'newtest123',
      confirmPassword: 'newtest123'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log('❌ Should have failed but succeeded', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log('✅ Correctly rejected wrong password', 'green');
      return true;
    }
    log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test 5: Change Password (with correct current password)
async function testChangePasswordCorrect() {
  try {
    log('\n📝 Test 5: Change Password (Correct)', 'blue');
    const response = await axios.put(`${BASE_URL}/company-auth/change-password`, {
      currentPassword: testCompany.password,
      newPassword: 'newtest123',
      confirmPassword: 'newtest123'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      log('✅ Password changed successfully', 'green');

      // Update test password for future tests
      testCompany.password = 'newtest123';

      // Try logging in with new password
      log('\n🔄 Testing login with new password...', 'yellow');
      const loginResponse = await axios.post(`${BASE_URL}/company-auth/login`, {
        email: testCompany.email,
        password: testCompany.password
      });

      if (loginResponse.data.success) {
        log('✅ Login with new password successful', 'green');
        authToken = loginResponse.data.token;
        return true;
      }
    }
  } catch (error) {
    log(`❌ Change password failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test 6: Change Password Back to Original
async function testChangePasswordBack() {
  try {
    log('\n📝 Test 6: Change Password Back to Original', 'blue');
    const response = await axios.put(`${BASE_URL}/company-auth/change-password`, {
      currentPassword: testCompany.password,
      newPassword: 'test123',
      confirmPassword: 'test123'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      log('✅ Password changed back successfully', 'green');
      testCompany.password = 'test123';
      return true;
    }
  } catch (error) {
    log(`❌ Change password back failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  log('🚀 Starting Company Profile API Tests', 'blue');
  log('='.repeat(50), 'blue');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const tests = [
    { name: 'Register/Check Company', fn: testRegisterCompany },
    { name: 'Login', fn: testLogin },
    { name: 'Get Profile', fn: testGetProfile },
    { name: 'Update Profile', fn: testUpdateProfile },
    { name: 'Change Password (Wrong)', fn: testChangePasswordWrong },
    { name: 'Change Password (Correct)', fn: testChangePasswordCorrect },
    { name: 'Change Password Back', fn: testChangePasswordBack }
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  log('\n' + '='.repeat(50), 'blue');
  log('📊 Test Results:', 'blue');
  log(`Total Tests: ${results.total}`, 'yellow');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log('='.repeat(50), 'blue');
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
});
