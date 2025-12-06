require('dotenv').config();
const mongoose = require('mongoose');

async function fixAllTasks() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');
    
    const Task = require('./models/Task');
    const Employee = require('./models/Employee');
    
    // Get all active employees
    const employees = await Employee.find({ isActive: { $ne: false } });
    const employeeIds = employees.map(e => e._id.toString());
    
    console.log('\n👥 Active employees:', employees.length);
    employees.forEach(e => {
      console.log(`   - ${e.name}: ${e._id}`);
    });
    
    // Get all tasks
    const allTasks = await Task.find({});
    console.log('\n📊 Total tasks:', allTasks.length);
    
    // Find orphan tasks
    const orphanTasks = allTasks.filter(task => {
      const assignedToStr = task.assignedTo ? task.assignedTo.toString() : null;
      return !employeeIds.includes(assignedToStr);
    });
    
    console.log('\n⚠️  Orphan tasks (assigned to deleted employees):', orphanTasks.length);
    orphanTasks.forEach(task => {
      console.log(`   - "${task.title}" → ${task.assignedTo}`);
    });
    
    // DELETE ALL ORPHAN TASKS
    if (orphanTasks.length > 0) {
      const orphanIds = orphanTasks.map(t => t._id);
      await Task.deleteMany({ _id: { $in: orphanIds } });
      console.log('\n✅ Deleted', orphanTasks.length, 'orphan tasks');
    }
    
    // Show remaining valid tasks
    const validTasks = await Task.find({});
    console.log('\n📋 Remaining valid tasks:', validTasks.length);
    validTasks.forEach(task => {
      const emp = employees.find(e => e._id.toString() === task.assignedTo.toString());
      console.log(`   - "${task.title}" → ${emp ? emp.name : 'Unknown'}`);
    });
    
    mongoose.connection.close();
    console.log('\n✅ Done! Database cleaned.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllTasks();
