const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupOrphanTasks() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    const Employee = require('./models/Employee');

    // Get all tasks
    const allTasks = await Task.find({});
    console.log(`\n📊 Total tasks: ${allTasks.length}`);

    // Get all active employee IDs
    const activeEmployees = await Employee.find({ isActive: true });
    const activeEmployeeIds = new Set(activeEmployees.map(e => e._id.toString()));
    console.log(`👥 Active employees: ${activeEmployees.length}`);

    // Find orphan tasks (assigned to non-existent or inactive employees)
    const orphanTasks = [];
    for (const task of allTasks) {
      const assignedToId = task.assignedTo.toString();
      if (!activeEmployeeIds.has(assignedToId)) {
        orphanTasks.push(task);
      }
    }

    console.log(`\n⚠️  Found ${orphanTasks.length} orphan tasks`);

    if (orphanTasks.length > 0) {
      console.log('\n📋 Orphan tasks:');
      orphanTasks.forEach((task, i) => {
        console.log(`${i + 1}. "${task.title}" - assigned to: ${task.assignedTo}`);
      });

      // Options:
      // 1. Delete orphan tasks
      // 2. Mark as unassigned
      // 3. Reassign to company admin

      console.log('\n💡 Options:');
      console.log('1. Delete these tasks');
      console.log('2. Mark as "Unassigned" (set assignedTo to null)');
      console.log('3. Keep as is (for manual review)');
      
      // For now, just report - you can uncomment to take action
      // await Task.deleteMany({ _id: { $in: orphanTasks.map(t => t._id) } });
      // console.log('✅ Deleted orphan tasks');
    } else {
      console.log('✅ No orphan tasks found - all tasks are properly assigned!');
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrphanTasks();
