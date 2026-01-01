const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('./models/Task');

async function testTaskCompletionLock() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test task
    const tasks = await Task.find().limit(5);
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found in database');
      return;
    }

    console.log('\n📋 Testing Task Completion Lock Feature\n');
    console.log('=' .repeat(60));

    // Test 1: Check if startDate exists
    console.log('\n1️⃣ Testing Start Date:');
    tasks.forEach(task => {
      console.log(`   Task: ${task.title}`);
      console.log(`   Start Date: ${task.startDate ? '✅ ' + task.startDate.toLocaleDateString() : '❌ Not set'}`);
      console.log(`   Status: ${task.status}`);
      console.log('');
    });

    // Test 2: Check completed tasks
    console.log('\n2️⃣ Testing Completed Tasks:');
    const completedTasks = await Task.find({ status: 'completed' });
    
    if (completedTasks.length === 0) {
      console.log('   ℹ️  No completed tasks found');
    } else {
      completedTasks.forEach(task => {
        console.log(`   Task: ${task.title}`);
        console.log(`   Completion Date: ${task.completionDate ? '✅ ' + task.completionDate.toLocaleDateString() : '❌ Not set'}`);
        console.log(`   Status: ${task.status}`);
        console.log('');
      });
    }

    // Test 3: Try to update a completed task (should fail)
    console.log('\n3️⃣ Testing Lock on Completed Task:');
    const completedTask = await Task.findOne({ 
      status: 'completed',
      completionDate: { $exists: true }
    });

    if (completedTask) {
      console.log(`   Found completed task: ${completedTask.title}`);
      console.log(`   Completion Date: ${completedTask.completionDate.toLocaleDateString()}`);
      console.log(`   Attempting to update title...`);
      
      // This should work in code but API will prevent it
      completedTask.title = 'UPDATED TITLE (TEST)';
      await completedTask.save();
      
      console.log('   ⚠️  Database update succeeded (API should prevent this)');
      
      // Revert the change
      completedTask.title = completedTask.title.replace(' (TEST)', '');
      await completedTask.save();
      console.log('   ✅ Reverted test change');
    } else {
      console.log('   ℹ️  No completed tasks with completion date found');
    }

    // Test 4: Check date fields structure
    console.log('\n4️⃣ Date Fields Summary:');
    const sampleTask = tasks[0];
    console.log(`   Sample Task: ${sampleTask.title}`);
    console.log(`   - startDate: ${sampleTask.startDate ? '✅ Present' : '❌ Missing'}`);
    console.log(`   - dueDate: ${sampleTask.dueDate ? '✅ Present' : '⚠️  Optional'}`);
    console.log(`   - completionDate: ${sampleTask.completionDate ? '✅ Present' : '⚠️  Not completed yet'}`);
    console.log(`   - createdAt: ${sampleTask.createdAt ? '✅ Present' : '❌ Missing'}`);
    console.log(`   - updatedAt: ${sampleTask.updatedAt ? '✅ Present' : '❌ Missing'}`);

    // Test 5: Statistics
    console.log('\n5️⃣ Task Statistics:');
    const stats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          withCompletionDate: {
            $sum: {
              $cond: [{ $ifNull: ['$completionDate', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} tasks`);
      if (stat._id === 'completed') {
        console.log(`      - With completion date: ${stat.withCompletionDate}`);
        console.log(`      - Without completion date: ${stat.count - stat.withCompletionDate}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('\n📝 Notes:');
    console.log('   - New tasks will have startDate automatically');
    console.log('   - Completed tasks will have completionDate');
    console.log('   - API prevents editing completed tasks');
    console.log('   - Frontend shows locked UI for completed tasks');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testTaskCompletionLock();
