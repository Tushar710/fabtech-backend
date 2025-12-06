const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Quotation = require('./models/Quotation');

async function checkQuotationFields() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check all quotations
    const allQuotations = await Quotation.find()
      .select('quotationNumber status rejectionReason rejectedAt leadName')
      .lean();

    console.log('\n📊 All Quotations:');
    console.log('Total:', allQuotations.length);
    
    allQuotations.forEach((q, index) => {
      console.log(`\n${index + 1}. ${q.quotationNumber} - ${q.status}`);
      console.log(`   Lead: ${q.leadName}`);
      console.log(`   Has rejectionReason field: ${q.hasOwnProperty('rejectionReason')}`);
      console.log(`   Rejection Reason: "${q.rejectionReason || 'EMPTY'}"`);
      if (q.rejectedAt) {
        console.log(`   Rejected At: ${q.rejectedAt}`);
      }
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkQuotationFields();
