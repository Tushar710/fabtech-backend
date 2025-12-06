require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Branch = require('../models/Branch');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech';

async function checkCreatedBy() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const companyId = '68e63bfa6bc050bb4675c9a6';
    const branchId = '69134a4ff54324b947049ee3';

    // Get branch info
    const branch = await Branch.findById(branchId);
    console.log(`🏢 Branch: ${branch.name}\n`);

    // Check all leads
    const allLeads = await Lead.find({ company: companyId })
      .select('customerName createdBy assignedBranch')
      .limit(20);

    console.log(`📊 Sample leads (first 20):\n`);
    allLeads.forEach(lead => {
      console.log(`- ${lead.customerName || 'Unknown'}`);
      console.log(`  createdBy: ${lead.createdBy || 'NOT SET'}`);
      console.log(`  assignedBranch: ${lead.assignedBranch || 'NOT SET'}`);
      console.log(`  createdBy type: ${typeof lead.createdBy}`);
      console.log('');
    });

    // Count by createdBy
    console.log('\n📊 Leads by createdBy:');
    const byCreatedBy = await Lead.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: '$createdBy',
          count: { $sum: 1 }
        }
      }
    ]);

    byCreatedBy.forEach(item => {
      console.log(`  ${item._id || 'NULL/UNDEFINED'}: ${item.count} leads`);
    });

    // Leads with assignedBranch but no createdBy
    const assignedButNoCreator = await Lead.countDocuments({
      assignedBranch: { $exists: true, $ne: null },
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    });

    console.log(`\n⚠️  Leads with assignedBranch but no createdBy: ${assignedButNoCreator}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkCreatedBy();
