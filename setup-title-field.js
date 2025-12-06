const mongoose = require('mongoose');
const FormField = require('./models/FormField');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const setupTitleField = async () => {
  try {
    console.log('🔄 Setting up title field...');
    
    // Check if title field already exists
    const existingField = await FormField.findOne({ name: 'title' });
    
    if (existingField) {
      console.log('📝 Title field already exists, updating options...');
      
      // Update existing field with new options
      existingField.options = [
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
      existingField.required = true;
      existingField.order = 0; // Make it first field
      existingField.active = true;
      
      await existingField.save();
      console.log('✅ Title field updated successfully!');
    } else {
      // Create new title field
      const titleField = new FormField({
        name: 'title',
        label: 'Enquiry Purpose',
        type: 'select',
        placeholder: 'Select your enquiry purpose...',
        required: true,
        options: [
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
        ],
        order: 0, // Make it first field
        active: true,
        formType: 'both' // Show in both lead forms and auto-capture forms
      });
      
      await titleField.save();
      console.log('✅ Title field created successfully!');
    }
    
    // List all form fields
    const allFields = await FormField.find({ active: true }).sort({ order: 1 });
    console.log('\n📋 Current form fields:');
    allFields.forEach(field => {
      console.log(`  - ${field.name} (${field.type}) - ${field.label} ${field.required ? '*' : ''}`);
      if (field.options && field.options.length > 0) {
        console.log(`    Options: ${field.options.map(opt => opt.label).join(', ')}`);
      }
    });
    
    console.log('\n🎉 Setup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error setting up title field:', error);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
  setupTitleField();
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
