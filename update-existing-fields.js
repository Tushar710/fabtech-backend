const mongoose = require('mongoose');
const FormField = require('./models/FormField');

// Connect to MongoDB
mongoose.connect('mongodb+srv://tusharpawar:Tushar%40123@cluster0.hbopo.mongodb.net/crm-leads?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateExistingFields() {
  try {
    console.log('🔍 Checking existing form fields...');
    
    // Find all form fields without companyId
    const fieldsWithoutCompany = await FormField.find({ 
      $or: [
        { companyId: { $exists: false } },
        { companyId: null }
      ]
    });
    
    console.log(`📊 Found ${fieldsWithoutCompany.length} fields without companyId`);
    
    if (fieldsWithoutCompany.length === 0) {
      console.log('✅ All fields already have companyId');
      return;
    }
    
    // Default company ID (you can change this to your actual company ID)
    const defaultCompanyId = '68babac58ab96e9658ba62a0'; // Company A ID
    
    console.log(`🏢 Assigning default companyId: ${defaultCompanyId}`);
    
    // Update all fields without companyId
    const result = await FormField.updateMany(
      { 
        $or: [
          { companyId: { $exists: false } },
          { companyId: null }
        ]
      },
      { 
        $set: { 
          companyId: new mongoose.Types.ObjectId(defaultCompanyId)
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} form fields with companyId`);
    
    // Show updated fields
    const updatedFields = await FormField.find({});
    console.log('📋 All form fields now:');
    updatedFields.forEach(field => {
      console.log(`  - ${field.name} (${field.label}) -> Company: ${field.companyId}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating form fields:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

updateExistingFields();
