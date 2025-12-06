const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Task = require('./models/Task');
const Company = require('./models/Company');

async function fixUndefinedCompanyTasks() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all tasks with "undefined (Company)" creator
    const undefinedTasks = await Task.find({
      createdByName: /undefined.*Company/i
    });

    console.log(`\n📋 Found ${undefinedTasks.length} tasks with undefined company name`);

    let updated = 0;

    for (const task of undefinedTasks) {
      try {
        if (task.companyId) {
          const company = await Company.findById(task.companyId);
          if (company) {
            const creatorName = company.businessName || company.companyName || 'Company Admin';
            task.createdByName = creatorName;
            await task.save();
            console.log(`✅ Updated task "${task.title}" - Created by: ${creatorName}`);
            updated++;
          }
        }
      } catch (error) {
        console.error(`❌ Error updating task "${task.title}":`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUndefinedCompanyTasks();
