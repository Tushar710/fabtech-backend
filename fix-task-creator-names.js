const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Task = require('./models/Task');
const Employee = require('./models/Employee');
const User = require('./models/User');

async function fixTaskCreatorNames() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all tasks without createdByName
    const tasksWithoutCreatorName = await Task.find({
      $or: [
        { createdByName: { $exists: false } },
        { createdByName: null },
        { createdByName: '' }
      ]
    });

    console.log(`\n📋 Found ${tasksWithoutCreatorName.length} tasks without creator name`);

    let updated = 0;
    let failed = 0;

    for (const task of tasksWithoutCreatorName) {
      try {
        if (!task.createdBy) {
          console.log(`⚠️  Task "${task.title}" has no createdBy field`);
          failed++;
          continue;
        }

        let creatorName = 'Unknown';

        // Try to find creator in Employee collection
        const employee = await Employee.findById(task.createdBy);
        if (employee) {
          creatorName = employee.teamMemberName || employee.name || employee.email;
        } else {
          // Try User collection
          const user = await User.findById(task.createdBy);
          if (user) {
            creatorName = user.name || user.email;
          }
        }

        // Update task
        task.createdByName = creatorName;
        await task.save();

        console.log(`✅ Updated task "${task.title}" - Created by: ${creatorName}`);
        updated++;
      } catch (error) {
        console.error(`❌ Error updating task "${task.title}":`, error.message);
        failed++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Failed: ${failed}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixTaskCreatorNames();
