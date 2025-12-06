const mongoose = require('mongoose');
require('dotenv').config();

async function fixTaskAssignment() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    const Employee = require('./models/Employee');

    // Find Tushar Pawar
    const tushar = await Employee.findOne({ email: 'pawartushar@gmail.com' });
    if (!tushar) {
      console.error('❌ Tushar not found');
      process.exit(1);
    }

    console.log('👤 Found Tushar:', tushar.teamMemberName, tushar._id);

    // Update all tasks assigned to old ID
    const oldId = '692abdbf47c05c00a064c5a9';
    const result = await Task.updateMany(
      { assignedTo: oldId },
      { 
        $set: { 
          assignedTo: tushar._id,
          assignedToName: tushar.teamMemberName
        }
      }
    );

    console.log('✅ Updated tasks:', result.modifiedCount);

    // Verify
    const tusharTasks = await Task.find({ assignedTo: tushar._id });
    console.log('📋 Tushar now has', tusharTasks.length, 'tasks');

    await mongoose.connection.close();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixTaskAssignment();
