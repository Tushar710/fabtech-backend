require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Lead = require('../models/Lead');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech';

async function addCompanyToLeads() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const companyId = '68e63bfa6bc050bb4675c9a6';

    // Find leads with assignedBranch but no company
    const leadsToFix = await Lead.find({
      assignedBranch: { $exists: true, $ne: null },
      $or: [
        { company: { $exists: false } },
        { company: null },
        { company: undefined }
      ]
    });

    console.log(`📊 Found ${leadsToFix.length} leads without company field\n`);

    let fixedCount = 0;

    for (const lead of leadsToFix) {
      console.log(`🔄 Fixing lead: ${lead.customerName || lead.name || 'Unknown'}`);
      
      await Lead.updateOne(
        { _id: lead._id },
        { $set: { company: new mongoose.Types.ObjectId(companyId) } }
      );
      
      fixedCount++;
      console.log(`   ✅ Added company ID`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Fixed: ${fixedCount} leads`);

    // Verify
    console.log('\n🔍 Verifying...');
    const verifyLeads = await Lead.find({
      assignedBranch: { $exists: true, $ne: null }
    }).select('customerName assignedBranch company');

    console.log(`📋 Leads with branch assignment: ${verifyLeads.length}`);
    verifyLeads.forEach(lead => {
      console.log(`   - ${lead.customerName || 'Unknown'}: company=${lead.company ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

addCompanyToLeads();
