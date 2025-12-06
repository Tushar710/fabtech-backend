const mongoose = require('mongoose');
require('dotenv').config();

async function createSampleTask() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    const Employee = require('./models/Employee');

    // Find the employee
    const employee = await Employee.findOne({ email: 'pawartushar@gmail.com' });
    if (!employee) {
      console.error('❌ Employee not found');
      process.exit(1);
    }

    console.log('👤 Found employee:', employee.teamMemberName, employee._id);

    // Create a sample task
    const task = new Task({
      title: 'Test Task - Complete Project Documentation',
      description: 'Please complete the project documentation by end of day',
      assignedTo: employee._id,
      assignedToName: employee.teamMemberName,
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      companyId: employee.company,
      branchId: employee.branch,
      createdByName: 'System Admin'
    });

    await task.save();
    console.log('✅ Sample task created successfully!');
    console.log('📋 Task ID:', task._id);
    console.log('👤 Assigned to:', task.assignedToName);
    console.log('📅 Due date:', task.dueDate);

    await mongoose.connection.close();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSampleTask();
