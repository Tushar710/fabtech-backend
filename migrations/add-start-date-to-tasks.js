const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('../models/Task');

async function addStartDateToExistingTasks() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all tasks without startDate
    const tasksWithoutStartDate = await Task.find({
      $or: [
        { startDate: { $exists: false } },
        { startDate: null }
      ]
    });

    console.log(`📋 Found ${tasksWithoutStartDate.length} tasks without startDate\n`);

    if (tasksWithoutStartDate.length === 0) {
      console.log('✅ All tasks already have startDate!');
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const task of tasksWithoutStartDate) {
      try {
        // Use createdAt as startDate for existing tasks
        task.startDate = task.createdAt || new Date();
        await task.save();
        
        console.log(`✅ Updated: ${task.title}`);
        console.log(`   Start Date set to: ${task.startDate.toLocaleDateString()}`);
        updated++;
      } catch (error) {
        console.error(`❌ Failed to update: ${task.title}`, error.message);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully updated: ${updated} tasks`);
    console.log(`   ❌ Failed: ${failed} tasks`);
    console.log(`   📋 Total processed: ${tasksWithoutStartDate.length} tasks`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Migration Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run migration
console.log('🚀 Starting migration: Add startDate to existing tasks\n');
addStartDateToExistingTasks();
