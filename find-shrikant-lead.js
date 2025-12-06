const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const Quotation = require('./models/Quotation');

async function findShrikantLead() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find Shrikant lead
    const lead = await Lead.findOne({ 
      _id: '69245a076cb20cca752e4dd6'
    }).lean();
    
    if (!lead) {
      console.log('❌ Lead not found');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n👤 Lead Found:`);
    console.log(`   Name: ${lead.customerName || lead.name}`);
    console.log(`   Email: ${lead.email}`);
    console.log(`   ID: ${lead._id}`);
    
    // Test the API query
    const rejectedQuotation = await Quotation.findOne({
      lead: lead._id,
      status: 'rejected'
    })
    .sort({ rejectedAt: -1 })
    .select('rejectionReason rejectedAt quotationNumber')
    .lean();
    
    console.log(`\n📄 Rejected Quotation Query Result:`);
    if (rejectedQuotation) {
      console.log(`   ✅ FOUND!`);
      console.log(`   Quotation: ${rejectedQuotation.quotationNumber}`);
      console.log(`   Reason: ${rejectedQuotation.rejectionReason}`);
      console.log(`   Rejected At: ${rejectedQuotation.rejectedAt}`);
      
      console.log(`\n🎯 This should display in Lead Dashboard!`);
    } else {
      console.log(`   ❌ Not found`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findShrikantLead();
