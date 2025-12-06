require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Branch = require('../models/Branch');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech';

async function checkBranchLeads() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get company ID (from your logs)
    const companyId = '68e63bfa6bc050bb4675c9a6';

    // Get all branches
    const branches = await Branch.find({ company: companyId, isActive: true });
    console.log(`📊 Found ${branches.length} branches:\n`);

    for (const branch of branches) {
      console.log(`\n🏢 Branch: ${branch.name} (${branch._id})`);
      
      // Check leads with this branch
      const leads = await Lead.find({
        assignedBranch: branch._id,
        company: companyId
      }).select('customerName email assignedBranch company');

      console.log(`   📋 Leads count: ${leads.length}`);
      
      if (leads.length > 0) {
        console.log('   📝 Sample leads:');
        leads.slice(0, 3).forEach(lead => {
          console.log(`      - ${lead.customerName || 'No name'} (${lead.email})`);
          console.log(`        assignedBranch type: ${typeof lead.assignedBranch}, value: ${lead.assignedBranch}`);
          console.log(`        company type: ${typeof lead.company}, value: ${lead.company}`);
        });
      }
    }

    // Check all leads with assignedBranch
    console.log('\n\n📊 All leads with branch assignments:');
    const allAssignedLeads = await Lead.find({
      assignedBranch: { $exists: true, $ne: null }
    }).select('customerName assignedBranch assignedBranchName company');

    console.log(`   Total: ${allAssignedLeads.length} leads`);
    allAssignedLeads.forEach(lead => {
      console.log(`   - ${lead.customerName || 'No name'}`);
      console.log(`     Branch: ${lead.assignedBranchName} (${lead.assignedBranch})`);
      console.log(`     Company: ${lead.company}`);
      console.log(`     Types: branch=${typeof lead.assignedBranch}, company=${typeof lead.company}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkBranchLeads();
