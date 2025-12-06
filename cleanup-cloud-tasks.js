const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

async function cleanupCloudTasks() {
  try {
    // Use the same connection string as backend
    if (!process.env.MONGO_URI) {
      throw new Error('.env file not loaded properly');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas (Cloud)');
    console.log('📍 Database:', mongoose.connection.name);
    
    const Task = require('./models/Task');
    const Employee = require('./models/Employee');
    
    // Get all active employees
    const employees = await Employee.find({ isActive: { $ne: false } });
    const employeeIds = employees.map(e => e._id.toString());
    
    console.log('\n👥 Active employees:', employees.length);
    
    // Get all tasks
    const allTasks = await Task.find({});
    console.log('\n📊 Total tasks in cloud:', allTasks.length);
    
    // Find orphan tasks
    const orphanTasks = allTasks.filter(task => {
      const assignedToStr = task.assignedTo ? task.assignedTo.toString() : null;
      return !employeeIds.includes(assignedToStr);
    });
    
    console.log('⚠️  Orphan tasks:', orphanTasks.length);
    orphanTasks.forEach(task => {
      console.log(`   - "${task.title}" → ${task.assignedTo}`);
    });
    
    // DELETE ALL ORPHAN TASKS
    if (orphanTasks.length > 0) {
      const orphanIds = orphanTasks.map(t => t._id);
      const result = await Task.deleteMany({ _id: { $in: orphanIds } });
      console.log('\n✅ Deleted', result.deletedCount, 'orphan tasks from cloud');
    }
    
    // Find Tushar
    const tushar = await Employee.findOne({ email: 'pawartushar@gmail.com' });
    if (!tushar) {
      console.log('\n❌ Tushar not found in cloud database!');
      mongoose.connection.close();
      return;
    }
    
    console.log('\n👤 Tushar Pawar found:');
    console.log('   ID:', tushar._id.toString());
    console.log('   Company:', tushar.company.toString());
    
    // Create a fresh task for Tushar
    console.log('\n📝 Creating fresh task for Tushar...');
    const newTask = await Task.create({
      title: 'Complete Backend Integration',
      description: 'Fix the task assignment and display issue',
      assignedTo: tushar._id,
      assignedToName: tushar.name,
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      companyId: tushar.company,
      createdBy: tushar._id,
      createdByModel: 'Employee'
    });
    
    console.log('✅ Task created:', newTask.title);
    console.log('   Task ID:', newTask._id.toString());
    console.log('   Assigned to:', newTask.assignedToName);
    
    // Verify
    const verifyTasks = await Task.find({ assignedTo: tushar._id });
    console.log('\n✅ Verification: Tushar has', verifyTasks.length, 'task(s)');
    
    mongoose.connection.close();
    console.log('\n✅ Cloud database cleaned and ready!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupCloudTasks();
