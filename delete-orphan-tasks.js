const mongoose = require('mongoose');
require('dotenv').config();

async function deleteOrphanTasks() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    const Employee = require('./models/Employee');

    // Get all active employees
    const employees = await Employee.find({ isActive: true });
    const employeeIds = new Set(employees.map(e => e._id.toString()));
    
    console.log(`👥 Active employees: ${employees.length}`);
    employees.forEach(emp => {
      console.log(`  - ${emp.teamMemberName}: ${emp._id}`);
    });

    // Find orphan tasks
    const allTasks = await Task.find({});
    console.log(`\n📊 Total tasks: ${allTasks.length}`);
    
    const orphanTasks = allTasks.filter(task => 
      !employeeIds.has(task.assignedTo.toString())
    );
    
    console.log(`\n⚠️  Orphan tasks: ${orphanTasks.length}`);
    orphanTasks.forEach(task => {
      console.log(`  - "${task.title}" assigned to: ${task.assignedTo}`);
    });

    if (orphanTasks.length > 0) {
      const result = await Task.deleteMany({
        _id: { $in: orphanTasks.map(t => t._id) }
      });
      console.log(`\n✅ Deleted ${result.deletedCount} orphan tasks`);
    } else {
      console.log('\n✅ No orphan tasks found!');
    }

    // Show remaining tasks
    const remainingTasks = await Task.find({});
    console.log(`\n📋 Remaining tasks: ${remainingTasks.length}`);
    remainingTasks.forEach(task => {
      const emp = employees.find(e => e._id.toString() === task.assignedTo.toString());
      console.log(`  - "${task.title}" → ${emp?.teamMemberName || 'Unknown'}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteOrphanTasks();
