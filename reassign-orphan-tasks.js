const mongoose = require('mongoose');
require('dotenv').config();

async function reassignOrphanTasks() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    const Employee = require('./models/Employee');

    // Find Tushar
    const tushar = await Employee.findOne({ email: 'pawartushar@gmail.com' });
    console.log('👤 Tushar ID:', tushar._id);

    // Find tasks with non-existent employee ID
    const orphanId = '692abdbf47c05c00a064c5a9';
    const orphanTasks = await Task.find({ assignedTo: orphanId });
    
    console.log(`\n📋 Found ${orphanTasks.length} orphan tasks`);
    
    if (orphanTasks.length > 0) {
      // Reassign to Tushar
      const result = await Task.updateMany(
        { assignedTo: orphanId },
        { 
          $set: { 
            assignedTo: tushar._id,
            assignedToName: tushar.teamMemberName
          }
        }
      );
      
      console.log('✅ Reassigned', result.modifiedCount, 'tasks to Tushar');
    }

    // Verify
    const tusharTasks = await Task.find({ assignedTo: tushar._id });
    console.log('\n📊 Tushar now has', tusharTasks.length, 'tasks:');
    tusharTasks.forEach((task, i) => {
      console.log(`${i + 1}. ${task.title}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

reassignOrphanTasks();
