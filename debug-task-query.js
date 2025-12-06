const mongoose = require('mongoose');
require('dotenv').config();

async function debugTaskQuery() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    
    const employeeId = '68e65752b34dbf9e4b5bd6a0';
    
    console.log('\n🔍 Searching for tasks assigned to:', employeeId);
    console.log('🔍 EmployeeId type:', typeof employeeId);
    
    // Try different query methods
    console.log('\n--- Method 1: Direct string match ---');
    const tasks1 = await Task.find({ assignedTo: employeeId });
    console.log('Found:', tasks1.length, 'tasks');
    
    console.log('\n--- Method 2: ObjectId match ---');
    const tasks2 = await Task.find({ assignedTo: mongoose.Types.ObjectId(employeeId) });
    console.log('Found:', tasks2.length, 'tasks');
    
    console.log('\n--- All tasks in database ---');
    const allTasks = await Task.find({});
    console.log('Total tasks:', allTasks.length);
    
    allTasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.title}`);
      console.log('   assignedTo:', task.assignedTo);
      console.log('   assignedTo type:', typeof task.assignedTo);
      console.log('   assignedTo toString():', task.assignedTo.toString());
      console.log('   Match with employeeId?', task.assignedTo.toString() === employeeId);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugTaskQuery();
