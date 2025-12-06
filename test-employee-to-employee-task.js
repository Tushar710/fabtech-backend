const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

async function testEmployeeTaskAssignment() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const Employee = require('./models/Employee');
    
    // Get Test User
    const testUser = await Employee.findOne({ name: 'Test User' });
    if (!testUser) {
      console.log('❌ Test User not found!');
      return;
    }
    
    console.log('👤 Test User (Creator):');
    console.log('   ID:', testUser._id.toString());
    console.log('   Name:', testUser.name);
    console.log('   Company:', testUser.company.toString());
    
    // Get Tushar
    const tushar = await Employee.findOne({ email: 'pawartushar@gmail.com' });
    if (!tushar) {
      console.log('❌ Tushar not found!');
      return;
    }
    
    console.log('\n👤 Tushar Pawar (Assignee):');
    console.log('   ID:', tushar._id.toString());
    console.log('   Name:', tushar.name);
    
    // Generate token for Test User
    const token = jwt.sign({
      id: testUser._id.toString(),
      employeeId: testUser._id.toString(),
      email: testUser.email,
      companyId: testUser.company.toString(),
      role: 'employee',
      type: 'employee',
      _id: testUser._id.toString()
    }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    
    console.log('\n✅ Generated token for Test User');
    
    // Create task via API
    console.log('\n📝 Creating task: Test User → Tushar Pawar');
    
    const taskData = {
      title: 'Review Code Changes',
      description: 'Please review the latest backend changes and provide feedback',
      assignedTo: tushar._id.toString(),
      assignedToName: tushar.name,
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const response = await axios.post(
      'http://localhost:5001/api/tasks',
      taskData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Task created successfully!');
    console.log('   Task ID:', response.data.data._id);
    console.log('   Title:', response.data.data.title);
    console.log('   Assigned to:', response.data.data.assignedToName);
    console.log('   Created by:', response.data.data.createdBy);
    
    // Verify - Get Tushar's tasks
    console.log('\n🔍 Verifying: Fetching Tushar\'s tasks...');
    
    const tusharToken = jwt.sign({
      id: tushar._id.toString(),
      employeeId: tushar._id.toString(),
      email: tushar.email,
      companyId: tushar.company.toString(),
      role: 'employee',
      type: 'employee',
      _id: tushar._id.toString()
    }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    
    const tasksResponse = await axios.get(
      'http://localhost:5001/api/tasks/my-tasks',
      {
        headers: {
          'Authorization': `Bearer ${tusharToken}`
        }
      }
    );
    
    console.log('✅ Tushar now has', tasksResponse.data.data.length, 'task(s):');
    tasksResponse.data.data.forEach((task, i) => {
      console.log(`\n${i + 1}. ${task.title}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Priority: ${task.priority}`);
      console.log(`   Assigned to: ${task.assignedToName}`);
    });
    
    mongoose.connection.close();
    console.log('\n🎉 SUCCESS! Employee-to-employee task assignment working!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    mongoose.connection.close();
  }
}

testEmployeeTaskAssignment();
