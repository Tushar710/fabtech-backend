const mongoose = require('mongoose');
const FormField = require('./models/FormField');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const cleanupTitleFields = async () => {
  try {
    console.log('🔄 Cleaning up duplicate title fields...');
    
    // Find all title-related fields
    const titleFields = await FormField.find({ 
      $or: [
        { name: 'title' },
        { name: 'titles' }
      ]
    });
    
    console.log(`Found ${titleFields.length} title fields:`);
    titleFields.forEach(field => {
      console.log(`  - ${field.name}: ${field.label} (${field.options?.length || 0} options)`);
    });
    
    // Keep the 'title' field and remove 'titles'
    const duplicateField = await FormField.findOne({ name: 'titles' });
    if (duplicateField) {
      await FormField.findByIdAndDelete(duplicateField._id);
      console.log('✅ Removed duplicate "titles" field');
    }
    
    // Ensure the main title field has correct configuration
    const mainTitleField = await FormField.findOne({ name: 'title' });
    if (mainTitleField) {
      mainTitleField.label = 'Enquiry Purpose';
      mainTitleField.placeholder = 'Select your enquiry purpose...';
      mainTitleField.required = true;
      mainTitleField.order = 0;
      mainTitleField.active = true;
      mainTitleField.formType = 'both';
      
      // Ensure proper options
      mainTitleField.options = [
        { value: 'website_development', label: 'Website Development' },
        { value: 'mobile_app_development', label: 'Mobile App Development' },
        { value: 'digital_marketing', label: 'Digital Marketing' },
        { value: 'ecommerce_solution', label: 'E-commerce Solution' },
        { value: 'software_development', label: 'Software Development' },
        { value: 'ui_ux_design', label: 'UI/UX Design' },
        { value: 'seo_services', label: 'SEO Services' },
        { value: 'social_media_marketing', label: 'Social Media Marketing' },
        { value: 'business_consultation', label: 'Business Consultation' },
        { value: 'technical_support', label: 'Technical Support' },
        { value: 'other', label: 'Other' }
      ];
      
      await mainTitleField.save();
      console.log('✅ Updated main title field configuration');
    }
    
    // List final form fields
    const finalFields = await FormField.find({ active: true }).sort({ order: 1 });
    console.log('\n📋 Final form fields:');
    finalFields.forEach(field => {
      console.log(`  - ${field.name} (${field.type}) - ${field.label} ${field.required ? '*' : ''}`);
      if (field.options && field.options.length > 0) {
        console.log(`    Options: ${field.options.map(opt => opt.label).join(', ')}`);
      }
    });
    
    console.log('\n🎉 Cleanup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error cleaning up title fields:', error);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
  cleanupTitleFields();
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
