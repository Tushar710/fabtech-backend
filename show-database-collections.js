const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    showDatabaseInfo();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function showDatabaseInfo() {
  try {
    const db = mongoose.connection.db;
    
    console.log('\n📊 DATABASE INFORMATION:');
    console.log('🏢 Database Name:', db.databaseName);
    console.log('🔗 Connection String: mongodb+srv://sparkcomputer555_db_user:***@cluster0.jaloiyh.mongodb.net/');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    console.log('\n📋 COLLECTIONS IN DATABASE:');
    console.log('=' .repeat(50));
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      
      console.log(`📁 ${collectionName.padEnd(25)} | ${count} documents`);
      
      // Show sample data for key collections
      if (['formfields', 'leadstatuses', 'leads', 'companies'].includes(collectionName)) {
        const sampleDoc = await db.collection(collectionName).findOne({});
        if (sampleDoc) {
          console.log(`   📝 Sample fields: ${Object.keys(sampleDoc).slice(0, 5).join(', ')}...`);
          if (sampleDoc.companyId) {
            console.log(`   🏢 Company-specific: Yes (companyId: ${sampleDoc.companyId})`);
          }
        }
      }
    }
    
    console.log('\n🔍 FORM FIELDS DATA:');
    console.log('=' .repeat(30));
    const formFields = await db.collection('formfields').find({}).toArray();
    formFields.forEach(field => {
      console.log(`📝 ${field.name} (${field.label}) -> Company: ${field.companyId || 'No Company'}`);
    });
    
    console.log('\n🎯 LEAD STATUSES DATA:');
    console.log('=' .repeat(30));
    const leadStatuses = await db.collection('leadstatuses').find({}).toArray();
    if (leadStatuses.length > 0) {
      leadStatuses.forEach(status => {
        console.log(`🏷️  ${status.name} (${status.label}) -> Company: ${status.companyId || 'No Company'}`);
      });
    } else {
      console.log('📭 No lead statuses found - create some using the LeadStatusManager!');
    }
    
    console.log('\n💾 DATA STORAGE SUMMARY:');
    console.log('=' .repeat(40));
    console.log('🌐 Cloud Provider: MongoDB Atlas');
    console.log('📍 Cluster: cluster0.jaloiyh.mongodb.net');
    console.log('👤 Database User: sparkcomputer555_db_user');
    console.log('🔒 Security: SSL/TLS encrypted connection');
    console.log('🏢 Multi-tenancy: Company-specific data isolation');
    
  } catch (error) {
    console.error('❌ Error showing database info:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}
