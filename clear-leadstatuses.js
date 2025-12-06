const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    clearLeadStatuses();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function clearLeadStatuses() {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('leadstatuses');
    
    // Check current status count
    const currentCount = await collection.countDocuments();
    console.log(`📊 Current lead statuses: ${currentCount}`);
    
    if (currentCount > 0) {
      // Show existing statuses
      const existingStatuses = await collection.find({}).toArray();
      console.log('\n📋 Existing statuses:');
      existingStatuses.forEach(status => {
        console.log(`  - ${status.name} (${status.label}) -> Company: ${status.companyId}`);
      });
      
      // Delete all lead statuses
      const result = await collection.deleteMany({});
      console.log(`\n🗑️  Deleted ${result.deletedCount} lead statuses`);
    }
    
    // Verify collection is empty
    const finalCount = await collection.countDocuments();
    console.log(`\n✅ Final lead statuses count: ${finalCount}`);
    
    if (finalCount === 0) {
      console.log('🎯 Lead statuses collection is now empty - ready for custom status creation!');
    }
    
  } catch (error) {
    console.error('❌ Error clearing lead statuses:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}
