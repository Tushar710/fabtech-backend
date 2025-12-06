const mongoose = require('mongoose');
require('dotenv').config();

async function checkTasksByCompany() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    const Employee = require('./models/Employee');

    // Get all tasks grouped by company
    const tasks = await Task.find({});
    console.log(`\n📊 Total tasks in database: ${tasks.length}\n`);

    // Group by company
    const tasksByCompany = {};
    tasks.forEach(task => {
      const companyId = task.companyId?.toString() || 'no-company';
      if (!tasksByCompany[companyId]) {
        tasksByCompany[companyId] = [];
      }
      tasksByCompany[companyId].push(task);
    });

    // Show tasks for each company
    for (const [companyId, companyTasks] of Object.entries(tasksByCompany)) {
      console.log(`\n🏢 Company: ${companyId}`);
      console.log(`   Tasks: ${companyTasks.length}`);
      
      companyTasks.forEach((task, i) => {
        console.log(`\n   ${i + 1}. "${task.title}"`);
        console.log(`      Assigned to: ${task.assignedTo}`);
        console.log(`      Name: ${task.assignedToName}`);
      });
      
      // Check employees for this company
      const employees = await Employee.find({ company: companyId, isActive: true });
      console.log(`\n   👥 Active employees in this company: ${employees.length}`);
      employees.forEach(emp => {
        console.log(`      - ${emp.teamMemberName}: ${emp._id}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTasksByCompany();
