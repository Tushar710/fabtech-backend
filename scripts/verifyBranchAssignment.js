const mongoose = require('mongoose');
require('dotenv').config();

async function verifyAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-database');
    console.log('✅ Connected to MongoDB\n');

    const Lead = require('../models/Lead');
    
    // Check the two leads that were just assigned
    const leadIds = ['691daf15525c60f097359523', '691dabc1525c60f0973594f9'];
    
    console.log('🔍 Checking assigned leads:\n');
    
    for (const leadId of leadIds) {
      const lead = await Lead.findById(leadId);
      
      if (lead) {
        console.log(`📋 Lead: ${lead.customerName || lead.name}`);
        console.log(`   ID: ${lead._id}`);
        console.log(`   assignedBranch: ${lead.assignedBranch || 'NOT SET'}`);
        console.log(`   assignedBranchName: ${lead.assignedBranchName || 'NOT SET'}`);
        console.log(`   company: ${lead.company || 'NOT SET'}`);
        console.log('');
      } else {
        console.log(`❌ Lead ${leadId} not found\n`);
      }
    }
    
    // Check all leads with assignedBranch = pune fabtech branch ID
    const branchId = '69134a4ff54324b947049ee3';
    const branchLeads = await Lead.find({ assignedBranch: branchId });
    
    console.log(`\n📊 Total leads assigned to branch ${branchId}: ${branchLeads.length}`);
    
    if (branchLeads.length > 0) {
      console.log('\n✅ Sample assigned leads:');
      branchLeads.slice(0, 5).forEach(lead => {
        console.log(`   - ${lead.customerName || lead.name} (${lead._id})`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyAssignment();
