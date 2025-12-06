const mongoose = require('mongoose');
require('dotenv').config();

const Lead = require('../models/Lead');
const Branch = require('../models/Branch');

async function checkAssignedLeads() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-database');
    console.log('✅ Connected to MongoDB');

    // Get all branches
    const branches = await Branch.find({});
    console.log(`\n📊 Found ${branches.length} branches:`);
    
    for (const branch of branches) {
      console.log(`\n🏢 Branch: ${branch.name} (ID: ${branch._id})`);
      
      // Check leads assigned to this branch
      const assignedLeads = await Lead.find({ assignedBranch: branch._id });
      console.log(`   📋 Assigned Leads: ${assignedLeads.length}`);
      
      if (assignedLeads.length > 0) {
        console.log('   Sample leads:');
        assignedLeads.slice(0, 3).forEach(lead => {
          console.log(`   - ${lead.customerName || lead.name} (ID: ${lead._id})`);
          console.log(`     assignedBranch: ${lead.assignedBranch}`);
          console.log(`     company: ${lead.company}`);
        });
      }
      
      // Check leads created by this branch
      const createdLeads = await Lead.find({ createdByBranch: branch._id });
      console.log(`   ➕ Self-Created Leads: ${createdLeads.length}`);
    }

    // Check leads with assignedBranch but no match
    const allAssignedLeads = await Lead.find({ assignedBranch: { $exists: true, $ne: null } });
    console.log(`\n📊 Total leads with assignedBranch: ${allAssignedLeads.length}`);
    
    // Check for orphaned assignments
    const branchIds = branches.map(b => b._id.toString());
    const orphanedLeads = allAssignedLeads.filter(lead => 
      !branchIds.includes(lead.assignedBranch?.toString())
    );
    
    if (orphanedLeads.length > 0) {
      console.log(`\n⚠️  Found ${orphanedLeads.length} leads assigned to non-existent branches:`);
      orphanedLeads.forEach(lead => {
        console.log(`   - ${lead.customerName || lead.name}: assignedBranch = ${lead.assignedBranch}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAssignedLeads();
