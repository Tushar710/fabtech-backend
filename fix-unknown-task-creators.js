const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Task = require('./models/Task');
const Employee = require('./models/Employee');
const User = require('./models/User');
const Company = require('./models/Company');

async function fixUnknownTaskCreators() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all tasks with "Unknown" creator
    const unknownTasks = await Task.find({
      createdByName: 'Unknown'
    });

    console.log(`\n📋 Found ${unknownTasks.length} tasks with "Unknown" creator`);

    let updated = 0;
    let stillUnknown = 0;

    for (const task of unknownTasks) {
      try {
        if (!task.createdBy) {
          console.log(`⚠️  Task "${task.title}" has no createdBy field`);
          stillUnknown++;
          continue;
        }

        let creatorName = 'Unknown';

        // Try to find creator in Employee collection
        const employee = await Employee.findById(task.createdBy);
        if (employee) {
          creatorName = employee.teamMemberName || employee.name || employee.email;
          console.log(`✅ Found employee: ${creatorName}`);
        } else {
          // Try User collection
          const user = await User.findById(task.createdBy);
          if (user) {
            creatorName = user.name || user.email;
            console.log(`✅ Found user: ${creatorName}`);
            
            // If user has company, get company name
            if (user.company) {
              const company = await Company.findById(user.company);
              if (company) {
                creatorName = company.companyName || company.name || creatorName;
                console.log(`✅ Found company: ${creatorName}`);
              }
            }
          } else {
            // Try to get company from task's companyId
            if (task.companyId) {
              const company = await Company.findById(task.companyId);
              if (company) {
                creatorName = company.businessName || company.companyName || company.name || 'Company Admin';
                console.log(`✅ Using company name: ${creatorName}`);
              }
            }
          }
        }

        if (creatorName !== 'Unknown') {
          // Update task
          task.createdByName = creatorName;
          await task.save();
          console.log(`✅ Updated task "${task.title}" - Created by: ${creatorName}`);
          updated++;
        } else {
          console.log(`⚠️  Still unknown for task "${task.title}"`);
          stillUnknown++;
        }
      } catch (error) {
        console.error(`❌ Error updating task "${task.title}":`, error.message);
        stillUnknown++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️  Still Unknown: ${stillUnknown}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUnknownTaskCreators();
