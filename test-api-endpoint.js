require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testAPI() {
  try {
    console.log('🧪 Testing Task API Endpoint\n');
    
    // Step 1: Generate a test token for Tushar
    const tusharId = '68e65752b34dbf9e4b5bd6a0';
    const companyId = '68e6368c699072848aec9a02';
    
    const token = jwt.sign({
      id: tusharId,
      employeeId: tusharId,
      email: 'pawartushar@gmail.com',
      companyId: companyId,
      departmentId: '68e656a7b34dbf9e4b5bd686',
      role: 'employee',
      type: 'employee',
      _id: tusharId
    }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    
    console.log('✅ Generated test token for Tushar');
    console.log('   Employee ID:', tusharId);
    
    // Step 2: Call the API
    console.log('\n📡 Calling GET /api/tasks/my-tasks');
    const response = await axios.get('http://localhost:5001/api/tasks/my-tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.length > 0) {
      console.log('\n🎉 SUCCESS! Tasks found:');
      response.data.data.forEach((task, i) => {
        console.log(`\n${i + 1}. ${task.title}`);
        console.log(`   Assigned to: ${task.assignedToName}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Priority: ${task.priority}`);
        console.log(`   Due: ${new Date(task.dueDate).toLocaleDateString()}`);
      });
    } else {
      console.log('\n⚠️  No tasks found for Tushar');
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
  }
}

testAPI();
