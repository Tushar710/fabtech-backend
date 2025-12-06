const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    fixIndexes();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function fixIndexes() {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('formfields');
    
    // Check current indexes
    const indexes = await collection.indexes();
    console.log('📊 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (unique: ${index.unique || false})`);
    });
    
    // Drop the old single field unique index on 'name'
    try {
      await collection.dropIndex({ name: 1 });
      console.log('✅ Dropped old unique index on name field');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Old index on name field does not exist');
      } else {
        console.log('⚠️  Error dropping old index:', error.message);
      }
    }
    
    // Create the compound index for company-specific unique names
    try {
      await collection.createIndex(
        { name: 1, companyId: 1 }, 
        { unique: true, name: 'name_companyId_unique' }
      );
      console.log('✅ Created compound unique index on name + companyId');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️  Compound index already exists');
      } else {
        console.log('⚠️  Error creating compound index:', error.message);
      }
    }
    
    // Verify final indexes
    const finalIndexes = await collection.indexes();
    console.log('\n📊 Final indexes:');
    finalIndexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (unique: ${index.unique || false})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}
