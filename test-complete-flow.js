require('dotenv').config();
const mongoose = require('mongoose');

async function testCompleteFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');
    
    const Task = require('./models/Task');
    const Employee = require('./models/Employee');
    
    // Step 1: Get Tushar's details
    console.log('\n📍 STEP 1: Finding Tushar Pawar');
    const tushar = await Employee.findOne({ email: 'pawartushar@gmail.com' });
    if (!tushar) {
      console.log('❌ Tushar not found!');
      process.exit(1);
    }
    console.log('✅ Found Tushar:', tushar.name);
    console.log('   ID:', tushar._id.toString());
    console.log('   Company:', tushar.company.toString());
    
    // Step 2: Get any other employee from same company
    console.log('\n📍 STEP 2: Finding another employee');
    const testUser = await Employee.findOne({ 
      company: tushar.company,
      _id: { $ne: tushar._id }
    });
    if (!testUser) {
      console.log('⚠️  No other employee found, using Tushar as creator');
      var creatorId = tushar._id;
    } else {
      console.log('✅ Found employee:', testUser.name);
      console.log('   ID:', testUser._id.toString());
      var creatorId = testUser._id;
    }
    
    // Step 3: Delete all existing tasks
    console.log('\n📍 STEP 3: Cleaning up old tasks');
    await Task.deleteMany({});
    console.log('✅ Deleted all old tasks');
    
    // Step 4: Create a fresh task assigned to Tushar
    console.log('\n📍 STEP 4: Creating task for Tushar');
    const newTask = await Task.create({
      title: 'Complete Backend Integration',
      description: 'Fix the task assignment and display issue',
      assignedTo: tushar._id,
      assignedToName: tushar.name,
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      companyId: tushar.company,
      createdBy: creatorId,
      createdByModel: 'Employee'
    });
    console.log('✅ Task created:', newTask.title);
    console.log('   Task ID:', newTask._id.toString());
    console.log('   Assigned to ID:', newTask.assignedTo.toString());
    console.log('   Assigned to Name:', newTask.assignedToName);
    
    // Step 5: Verify task can be found
    console.log('\n📍 STEP 5: Verifying task retrieval');
    
    // Method 1: Direct ObjectId query
    const tasksById = await Task.find({ assignedTo: tushar._id });
    console.log('Method 1 (ObjectId):', tasksById.length, 'tasks found');
    
    // Method 2: String comparison
    const allTasks = await Task.find({});
    const filteredTasks = allTasks.filter(task => 
      task.assignedTo.toString() === tushar._id.toString()
    );
    console.log('Method 2 (String filter):', filteredTasks.length, 'tasks found');
    
    // Step 6: Test with string ID (like from JWT token)
    console.log('\n📍 STEP 6: Testing with string ID (JWT simulation)');
    const stringId = tushar._id.toString();
    console.log('String ID:', stringId);
    
    const allTasks2 = await Task.find({});
    const filtered2 = allTasks2.filter(task => {
      const taskAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;
      return taskAssignedTo === stringId;
    });
    console.log('✅ Found', filtered2.length, 'tasks using string comparison');
    
    if (filtered2.length > 0) {
      console.log('\n🎉 SUCCESS! Task assignment working correctly!');
      console.log('\n📋 Task Details:');
      console.log('   Title:', filtered2[0].title);
      console.log('   Assigned to:', filtered2[0].assignedToName);
      console.log('   Status:', filtered2[0].status);
      console.log('   Priority:', filtered2[0].priority);
    } else {
      console.log('\n❌ FAILED! No tasks found for Tushar');
    }
    
    mongoose.connection.close();
    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCompleteFlow();
