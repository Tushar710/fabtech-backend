const mongoose = require('mongoose');
require('dotenv').config();

async function checkTaskAssignments() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    const Employee = require('./models/Employee');

    // Get all tasks
    const tasks = await Task.find({});
    console.log(`\n📊 Total tasks: ${tasks.length}\n`);

    // Get all employees
    const employees = await Employee.find({ isActive: true });
    console.log(`👥 Active employees:`);
    employees.forEach(emp => {
      console.log(`  - ${emp.teamMemberName}: ${emp._id}`);
    });

    console.log(`\n📋 Task assignments:`);
    tasks.forEach((task, i) => {
      console.log(`\n${i + 1}. "${task.title}"`);
      console.log(`   Assigned to ID: ${task.assignedTo}`);
      console.log(`   Assigned to Name: ${task.assignedToName}`);
      
      const assignedEmployee = employees.find(e => e._id.toString() === task.assignedTo.toString());
      if (assignedEmployee) {
        console.log(`   ✅ Valid assignment to: ${assignedEmployee.teamMemberName}`);
      } else {
        console.log(`   ❌ ORPHAN TASK - Employee not found!`);
      }
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTaskAssignments();
