const mongoose = require('mongoose');
require('dotenv').config();

const DropdownOption = require('../models/DropdownOption');

async function checkStatusOptions() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/fabtech?retryWrites=true&w=majority&appName=Cluster0');
    
    console.log('✅ Connected to MongoDB\n');
    
    // Check all categories
    const allOptions = await DropdownOption.find({});
    console.log(`📊 Total dropdown options in database: ${allOptions.length}\n`);
    
    // Group by category
    const byCategory = {};
    allOptions.forEach(opt => {
      if (!byCategory[opt.category]) {
        byCategory[opt.category] = [];
      }
      byCategory[opt.category].push(opt);
    });
    
    console.log('📋 Options by category:');
    Object.keys(byCategory).forEach(cat => {
      console.log(`\n${cat} (${byCategory[cat].length} options):`);
      byCategory[cat].forEach(opt => {
        console.log(`  - ${opt.label} = ${opt.value} [Company: ${opt.companyId}]`);
      });
    });
    
    // Check specifically for status category
    console.log('\n\n🔍 Checking STATUS category specifically:');
    const statusOptions = await DropdownOption.find({ category: 'status' });
    console.log(`Found ${statusOptions.length} status options`);
    
    if (statusOptions.length > 0) {
      console.log('\nStatus options details:');
      statusOptions.forEach(opt => {
        console.log(`  ${opt.label} = ${opt.value}`);
        console.log(`    Company ID: ${opt.companyId}`);
        console.log(`    Active: ${opt.isActive}`);
        console.log(`    Sort Order: ${opt.sortOrder}\n`);
      });
    }
    
    // Check for company ID from memory
    const fabtechCompanyId = '68e63bfa6bc050bb4675c9a6';
    console.log(`\n🏢 Checking options for FABTECH company (${fabtechCompanyId}):`);
    const fabtechOptions = await DropdownOption.find({ companyId: fabtechCompanyId });
    console.log(`Found ${fabtechOptions.length} options for FABTECH company\n`);
    
    if (fabtechOptions.length > 0) {
      const fabtechByCategory = {};
      fabtechOptions.forEach(opt => {
        if (!fabtechByCategory[opt.category]) {
          fabtechByCategory[opt.category] = [];
        }
        fabtechByCategory[opt.category].push(opt);
      });
      
      Object.keys(fabtechByCategory).forEach(cat => {
        console.log(`${cat}: ${fabtechByCategory[cat].length} options`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStatusOptions();
