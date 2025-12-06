const mongoose = require('mongoose');
require('dotenv').config();

async function checkTasks() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    
    const tasks = await Task.find({});
    console.log('\n📋 Total tasks in database:', tasks.length);
    
    tasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.title}`);
      console.log(`   Assigned to: ${task.assignedToName} (${task.assignedTo})`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Priority: ${task.priority}`);
      console.log(`   Created: ${task.createdAt}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTasks();
