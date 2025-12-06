require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Lead = require('../models/Lead');

// MongoDB connection string
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech';
console.log('🔗 Using MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

async function fixLeadBranchAssignments() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all leads with assignedBranch as string
    const leadsToFix = await Lead.find({
      assignedBranch: { $exists: true, $ne: null }
    });

    console.log(`📊 Found ${leadsToFix.length} leads with branch assignments`);

    let fixedCount = 0;
    let alreadyCorrect = 0;

    for (const lead of leadsToFix) {
      let needsUpdate = false;
      const updates = {};

      // Check if assignedBranch is string
      if (typeof lead.assignedBranch === 'string') {
        try {
          updates.assignedBranch = new mongoose.Types.ObjectId(lead.assignedBranch);
          needsUpdate = true;
          console.log(`🔄 Converting assignedBranch for lead ${lead._id}`);
        } catch (err) {
          console.log(`❌ Invalid assignedBranch ID for lead ${lead._id}: ${lead.assignedBranch}`);
        }
      }

      // Check if company is string
      if (lead.company && typeof lead.company === 'string') {
        try {
          updates.company = new mongoose.Types.ObjectId(lead.company);
          needsUpdate = true;
          console.log(`🔄 Converting company for lead ${lead._id}`);
        } catch (err) {
          console.log(`❌ Invalid company ID for lead ${lead._id}: ${lead.company}`);
        }
      }

      // Update if needed
      if (needsUpdate) {
        await Lead.updateOne({ _id: lead._id }, { $set: updates });
        fixedCount++;
        console.log(`✅ Fixed lead ${lead._id}`);
      } else {
        alreadyCorrect++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Fixed: ${fixedCount} leads`);
    console.log(`✓ Already correct: ${alreadyCorrect} leads`);
    console.log(`📊 Total processed: ${leadsToFix.length} leads`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the fix
fixLeadBranchAssignments();
