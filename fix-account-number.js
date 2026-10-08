const mongoose = require('mongoose');
const { Company } = require('./models/Company');

mongoose.connect('mongodb://localhost:27017/crm-db', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      // Find the company and update its account number
      const result = await mongoose.connection.collection('companies').updateMany(
        {},
        { $set: { "companySettings.accountNumber": "5955147747", "accountNumber": "5955147747" } }
      );
      console.log('Updated DB successfully:', result);
    } catch (err) {
      console.error(err);
    } finally {
      process.exit(0);
    }
  });
