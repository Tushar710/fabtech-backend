const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Quotation = require('./models/Quotation');

async function addTestRejectionReason() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find a rejected quotation
    const rejectedQuotation = await Quotation.findOne({ status: 'rejected' });
    
    if (!rejectedQuotation) {
      console.log('❌ No rejected quotation found');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n📝 Updating quotation: ${rejectedQuotation.quotationNumber}`);
    console.log(`   Lead: ${rejectedQuotation.leadName}`);
    
    // Add rejection reason
    rejectedQuotation.rejectionReason = 'Price is too high compared to competitors';
    await rejectedQuotation.save();
    
    console.log('✅ Added rejection reason successfully!');
    console.log(`   Reason: ${rejectedQuotation.rejectionReason}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestRejectionReason();
