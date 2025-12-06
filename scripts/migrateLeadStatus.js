const mongoose = require('mongoose');
require('dotenv').config();

const DropdownOption = require('../models/DropdownOption');

async function migrateLeadStatusCategory() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/fabtech?retryWrites=true&w=majority&appName=Cluster0');
    
    console.log('✅ Connected to MongoDB');
    
    // Find all options with category 'leadStatus'
    const leadStatusOptions = await DropdownOption.find({ category: 'leadStatus' });
    
    console.log(`📊 Found ${leadStatusOptions.length} options with category 'leadStatus'`);
    
    if (leadStatusOptions.length === 0) {
      console.log('ℹ️ No leadStatus options found to migrate');
      process.exit(0);
    }
    
    // Update each option to use 'status' category
    for (const option of leadStatusOptions) {
      console.log(`🔄 Migrating: ${option.label} (${option.value})`);
      option.category = 'status';
      await option.save();
    }
    
    console.log(`✅ Successfully migrated ${leadStatusOptions.length} options from 'leadStatus' to 'status'`);
    
    // Verify migration
    const statusOptions = await DropdownOption.find({ category: 'status' });
    console.log(`📊 Total 'status' options after migration: ${statusOptions.length}`);
    console.log('Options:', statusOptions.map(o => `${o.label} (${o.value})`).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateLeadStatusCategory();
