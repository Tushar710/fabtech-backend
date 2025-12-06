const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const Quotation = require('./models/Quotation');

async function checkQuotationLeadRef() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the quotation with rejection reason
    const quotation = await Quotation.findOne({ 
      quotationNumber: 'KFT-25/26-6'
    }).lean();
    
    console.log(`\n📄 Quotation Details:`);
    console.log(`   Number: ${quotation.quotationNumber}`);
    console.log(`   Lead Name: ${quotation.leadName}`);
    console.log(`   Lead ID: ${quotation.lead}`);
    console.log(`   Rejection Reason: ${quotation.rejectionReason}`);
    
    // Check if lead exists
    const lead = await Lead.findById(quotation.lead).lean();
    
    if (lead) {
      console.log(`\n✅ Lead EXISTS in database:`);
      console.log(`   Name: ${lead.customerName || lead.name}`);
      console.log(`   Email: ${lead.email}`);
    } else {
      console.log(`\n❌ Lead DOES NOT EXIST (deleted or invalid reference)`);
      
      // Find another lead with rejected quotation
      console.log(`\n🔍 Looking for other leads with rejected quotations...`);
      
      const allLeads = await Lead.find().select('_id customerName email').lean();
      console.log(`\nTotal leads in database: ${allLeads.length}`);
      
      for (const testLead of allLeads.slice(0, 10)) {
        const rejQuot = await Quotation.findOne({
          lead: testLead._id,
          status: 'rejected',
          rejectionReason: { $exists: true, $ne: null, $ne: '' }
        }).lean();
        
        if (rejQuot) {
          console.log(`\n✅ FOUND! Lead with rejected quotation:`);
          console.log(`   Lead: ${testLead.customerName}`);
          console.log(`   Quotation: ${rejQuot.quotationNumber}`);
          console.log(`   Reason: ${rejQuot.rejectionReason}`);
          break;
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkQuotationLeadRef();
