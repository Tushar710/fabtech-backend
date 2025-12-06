const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const Quotation = require('./models/Quotation');

async function createTestRejectedQuotation() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get the second rejected quotation (Shrikant Kanade)
    const quotation = await Quotation.findOne({ 
      quotationNumber: 'KFT-25/26-11'
    });
    
    if (!quotation) {
      console.log('❌ Quotation not found');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n📄 Updating Quotation: ${quotation.quotationNumber}`);
    console.log(`   Lead Name: ${quotation.leadName}`);
    console.log(`   Lead ID: ${quotation.lead}`);
    
    // Check if lead exists
    const lead = await Lead.findById(quotation.lead);
    
    if (lead) {
      console.log(`✅ Lead exists: ${lead.customerName || lead.name}`);
      
      // Add rejection reason
      quotation.rejectionReason = 'Customer found better pricing from competitor';
      await quotation.save();
      
      console.log(`✅ Added rejection reason!`);
      console.log(`   Reason: ${quotation.rejectionReason}`);
    } else {
      console.log(`❌ Lead does not exist`);
      
      // Find any existing lead and update quotation
      const anyLead = await Lead.findOne().sort({ createdAt: -1 });
      
      if (anyLead) {
        console.log(`\n🔄 Reassigning to existing lead: ${anyLead.customerName || anyLead.name}`);
        quotation.lead = anyLead._id;
        quotation.leadName = anyLead.customerName || anyLead.name;
        quotation.leadEmail = anyLead.email;
        quotation.rejectionReason = 'Customer found better pricing from competitor';
        await quotation.save();
        
        console.log(`✅ Updated quotation successfully!`);
        console.log(`   New Lead: ${quotation.leadName}`);
        console.log(`   Reason: ${quotation.rejectionReason}`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestRejectedQuotation();
