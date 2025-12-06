require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Lead = require('../models/Lead');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech';

async function testBranchTracking() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const companyId = '68e63bfa6bc050bb4675c9a6';
    const branchId = '69134a4ff54324b947049ee3';

    // Company-assigned leads
    const companyAssigned = await Lead.countDocuments({
      assignedBranch: branchId,
      company: companyId
    });

    // Branch-added leads
    const branchAdded = await Lead.countDocuments({
      createdByBranch: branchId,
      company: companyId
    });

    console.log('📊 Branch Tracking Results:');
    console.log(`   🏢 Company-assigned leads: ${companyAssigned}`);
    console.log(`   ➕ Branch-added leads: ${branchAdded}`);
    console.log(`   📊 Total: ${companyAssigned + branchAdded}\n`);

    // Show sample leads
    if (companyAssigned > 0) {
      const sampleAssigned = await Lead.find({
        assignedBranch: branchId,
        company: companyId
      }).select('customerName createdByBranch').limit(3);

      console.log('📋 Sample company-assigned leads:');
      sampleAssigned.forEach(lead => {
        console.log(`   - ${lead.customerName} (createdByBranch: ${lead.createdByBranch || 'NOT SET'})`);
      });
    }

    if (branchAdded > 0) {
      const sampleBranchAdded = await Lead.find({
        createdByBranch: branchId,
        company: companyId
      }).select('customerName').limit(3);

      console.log('\n📋 Sample branch-added leads:');
      sampleBranchAdded.forEach(lead => {
        console.log(`   - ${lead.customerName}`);
      });
    } else {
      console.log('\n⚠️  No branch-added leads found.');
      console.log('   Branch needs to add leads using "Add Lead" button.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testBranchTracking();
