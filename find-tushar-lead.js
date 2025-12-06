const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const Quotation = require('./models/Quotation');

async function findTusharLead() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find Tushar Pawar lead
    const tusharLead = await Lead.findOne({ 
      $or: [
        { customerName: /tushar/i },
        { name: /tushar/i }
      ]
    }).lean();
    
    if (!tusharLead) {
      console.log('❌ Tushar lead not found');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n👤 Found Lead:`);
    console.log(`   Name: ${tusharLead.customerName || tusharLead.name}`);
    console.log(`   Email: ${tusharLead.email}`);
    console.log(`   ID: ${tusharLead._id}`);
    
    // Check for rejected quotation
    const rejectedQuotation = await Quotation.findOne({
      lead: tusharLead._id,
      status: 'rejected'
    })
    .sort({ rejectedAt: -1 })
    .select('rejectionReason rejectedAt quotationNumber')
    .lean();
    
    console.log(`\n📄 Rejected Quotation:`);
    if (rejectedQuotation) {
      console.log(`   ✅ Found!`);
      console.log(`   Quotation: ${rejectedQuotation.quotationNumber}`);
      console.log(`   Reason: ${rejectedQuotation.rejectionReason || 'No reason'}`);
      console.log(`   Rejected At: ${rejectedQuotation.rejectedAt}`);
    } else {
      console.log(`   ❌ No rejected quotation found`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findTusharLead();
