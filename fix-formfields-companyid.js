const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://tusharpawar:Tushar%40123@cluster0.hbopo.mongodb.net/crm-leads?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function fixFormFieldsCompanyId() {
  await connectDB();
  
  try {
    console.log('🔍 Checking existing form fields...');
    
    // Get the FormField collection directly
    const db = mongoose.connection.db;
    const formFieldsCollection = db.collection('formfields');
    
    // Find all form fields without companyId
    const fieldsWithoutCompany = await formFieldsCollection.find({ 
      companyId: { $exists: false }
    }).toArray();
    
    console.log(`📊 Found ${fieldsWithoutCompany.length} fields without companyId`);
    
    if (fieldsWithoutCompany.length === 0) {
      console.log('✅ All fields already have companyId');
      return;
    }
    
    // Show current fields
    console.log('📋 Current fields without companyId:');
    fieldsWithoutCompany.forEach(field => {
      console.log(`  - ${field.name} (${field.label})`);
    });
    
    // Default company ID (Company A)
    const defaultCompanyId = new mongoose.Types.ObjectId('68babac58ab96e9658ba62a0');
    
    console.log(`🏢 Adding companyId: ${defaultCompanyId} to existing fields...`);
    
    // Update all fields without companyId
    const result = await formFieldsCollection.updateMany(
      { companyId: { $exists: false } },
      { 
        $set: { 
          companyId: defaultCompanyId,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} form fields with companyId`);
    
    // Verify the update
    const updatedFields = await formFieldsCollection.find({}).toArray();
    console.log('\n📋 All form fields now:');
    updatedFields.forEach(field => {
      console.log(`  - ${field.name} (${field.label}) -> Company: ${field.companyId}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating form fields:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

fixFormFieldsCompanyId();
