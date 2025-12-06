const mongoose = require('mongoose');

// Connect to MongoDB using the same connection string as your app
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    updateFormFields();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function updateFormFields() {
  try {
    // Get the collection directly
    const db = mongoose.connection.db;
    const collection = db.collection('formfields');
    
    // Check current state
    const allFields = await collection.find({}).toArray();
    console.log(`📊 Total form fields: ${allFields.length}`);
    
    const fieldsWithoutCompany = allFields.filter(field => !field.companyId);
    console.log(`🔍 Fields without companyId: ${fieldsWithoutCompany.length}`);
    
    if (fieldsWithoutCompany.length > 0) {
      console.log('\n📋 Fields that need companyId:');
      fieldsWithoutCompany.forEach(field => {
        console.log(`  - ${field.name} (${field.label}) - ID: ${field._id}`);
      });
      
      // Update all fields without companyId to use the default company
      const defaultCompanyId = new mongoose.Types.ObjectId('68babac58ab96e9658ba62a0');
      
      const result = await collection.updateMany(
        { companyId: { $exists: false } },
        { 
          $set: { 
            companyId: defaultCompanyId,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`\n✅ Updated ${result.modifiedCount} fields with companyId: ${defaultCompanyId}`);
    } else {
      console.log('✅ All fields already have companyId');
    }
    
    // Verify the update
    const updatedFields = await collection.find({}).toArray();
    console.log('\n📋 Final state:');
    updatedFields.forEach(field => {
      console.log(`  - ${field.name} -> Company: ${field.companyId}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating form fields:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}
