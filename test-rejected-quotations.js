const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const Quotation = require('./models/Quotation');

async function testRejectedQuotations() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('MongoDB URI exists:', !!mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all rejected quotations
    const rejectedQuotations = await Quotation.find({ status: 'rejected' })
      .populate('lead', 'customerName email')
      .select('quotationNumber rejectionReason rejectedAt lead')
      .lean();

    console.log('\n📊 Rejected Quotations:');
    console.log('Total:', rejectedQuotations.length);
    
    rejectedQuotations.forEach((q, index) => {
      console.log(`\n${index + 1}. Quotation: ${q.quotationNumber}`);
      console.log(`   Lead: ${q.lead?.customerName || 'Unknown'}`);
      console.log(`   Rejection Reason: ${q.rejectionReason || 'No reason provided'}`);
      console.log(`   Rejected At: ${q.rejectedAt || 'N/A'}`);
    });

    // Test the query we use in the API
    console.log('\n\n🔍 Testing API Query:');
    const leads = await Lead.find().limit(5).lean();
    
    for (const lead of leads) {
      const rejectedQuotation = await Quotation.findOne({
        lead: lead._id,
        status: 'rejected'
      })
      .sort({ rejectedAt: -1 })
      .select('rejectionReason rejectedAt quotationNumber')
      .lean();
      
      console.log(`\nLead: ${lead.customerName}`);
      console.log(`Has rejected quotation: ${rejectedQuotation ? 'YES' : 'NO'}`);
      if (rejectedQuotation) {
        console.log(`Rejection Reason: ${rejectedQuotation.rejectionReason}`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testRejectedQuotations();
