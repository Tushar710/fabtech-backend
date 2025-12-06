const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

async function setupCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const ProductCategory = require('./models/ProductCategory');
    const User = require('./models/User');
    
    // Get first company
    const company = await User.findOne({ role: 'company' });
    if (!company) {
      console.log('❌ No company found!');
      return;
    }
    
    console.log('🏢 Setting up categories for:', company.businessName);
    console.log('   Company ID:', company._id.toString());
    
    // Default categories for Trading
    const tradingCategories = [
      {
        name: 'Pallet Truck',
        type: 'Trading',
        company: company._id,
        subCategories: [
          {
            name: 'Manual',
            specifications: [
              { name: 'Load Capacity', type: 'dropdown', options: ['1000 kg', '1500 kg', '2000 kg', '2500 kg', '3000 kg'], unit: 'kg', required: true },
              { name: 'Fork Width', type: 'dropdown', options: ['150 mm', '160 mm', '180 mm', '200 mm', '230 mm'], unit: 'mm', required: true },
              { name: 'Fork Length', type: 'dropdown', options: ['800 mm', '900 mm', '1000 mm', '1150 mm', '1200 mm', '1500 mm'], unit: 'mm', required: true },
              { name: 'Wheel Type', type: 'dropdown', options: ['Nylon', 'Polyurethane', 'Rubber'], required: true }
            ]
          },
          {
            name: 'Semi-Electric',
            specifications: [
              { name: 'Load Capacity', type: 'dropdown', options: ['1000 kg', '1500 kg', '2000 kg'], unit: 'kg', required: true },
              { name: 'Fork Width', type: 'dropdown', options: ['160 mm', '180 mm', '200 mm'], unit: 'mm', required: true },
              { name: 'Fork Length', type: 'dropdown', options: ['1000 mm', '1150 mm', '1200 mm'], unit: 'mm', required: true },
              { name: 'Battery Type', type: 'dropdown', options: ['Lead Acid', 'Lithium-ion'], required: true },
              { name: 'Lifting Height', type: 'dropdown', options: ['200 mm', '800 mm'], unit: 'mm', required: true }
            ]
          },
          {
            name: 'Fully Electric',
            specifications: [
              { name: 'Load Capacity', type: 'dropdown', options: ['1500 kg', '2000 kg', '2500 kg'], unit: 'kg', required: true },
              { name: 'Fork Width', type: 'dropdown', options: ['160 mm', '180 mm', '200 mm', '230 mm'], unit: 'mm', required: true },
              { name: 'Fork Length', type: 'dropdown', options: ['1000 mm', '1150 mm', '1200 mm'], unit: 'mm', required: true },
              { name: 'Battery Type', type: 'dropdown', options: ['Lead Acid', 'Lithium-ion'], required: true },
              { name: 'Lifting Height', type: 'dropdown', options: ['200 mm', '800 mm'], unit: 'mm', required: true }
            ]
          }
        ]
      },
      {
        name: 'Stacker',
        type: 'Trading',
        company: company._id,
        subCategories: [
          {
            name: 'Manual',
            specifications: [
              { name: 'Load Capacity', type: 'dropdown', options: ['1000 kg', '1500 kg', '2000 kg'], unit: 'kg', required: true },
              { name: 'Lifting Height', type: 'dropdown', options: ['1.6 m', '2.0 m', '2.5 m', '3.0 m', '3.5 m'], unit: 'm', required: true },
              { name: 'Fork Width', type: 'dropdown', options: ['150 mm', '160 mm', '180 mm'], unit: 'mm', required: true },
              { name: 'Fork Length', type: 'dropdown', options: ['800 mm', '1000 mm', '1150 mm'], unit: 'mm', required: true }
            ]
          },
          {
            name: 'Semi-Electric',
            specifications: [
              { name: 'Load Capacity', type: 'dropdown', options: ['1000 kg', '1500 kg', '2000 kg'], unit: 'kg', required: true },
              { name: 'Lifting Height', type: 'dropdown', options: ['1.6 m', '2.5 m', '3.0 m', '3.5 m', '4.5 m', '5.0 m'], unit: 'm', required: true },
              { name: 'Fork Width', type: 'dropdown', options: ['160 mm', '180 mm'], unit: 'mm', required: true },
              { name: 'Fork Length', type: 'dropdown', options: ['1000 mm', '1150 mm'], unit: 'mm', required: true },
              { name: 'Battery Type', type: 'dropdown', options: ['Lead Acid', 'Lithium-ion'], required: true }
            ]
          },
          {
            name: 'Fully Electric',
            specifications: [
              { name: 'Load Capacity', type: 'dropdown', options: ['1500 kg', '2000 kg'], unit: 'kg', required: true },
              { name: 'Lifting Height', type: 'dropdown', options: ['3.0 m', '3.5 m', '4.5 m', '5.0 m'], unit: 'm', required: true },
              { name: 'Fork Width', type: 'dropdown', options: ['160 mm', '180 mm'], unit: 'mm', required: true },
              { name: 'Fork Length', type: 'dropdown', options: ['1000 mm', '1150 mm'], unit: 'mm', required: true },
              { name: 'Battery Type', type: 'dropdown', options: ['Lead Acid', 'Lithium-ion'], required: true }
            ]
          }
        ]
      },
      {
        name: 'Scissor Lift',
        type: 'Trading',
        company: company._id,
        subCategories: [
          {
            name: 'Manual',
            specifications: [
              { name: 'Load Capacity', type: 'dropdown', options: ['300 kg', '500 kg', '1000 kg'], unit: 'kg', required: true },
              { name: 'Platform Size', type: 'dropdown', options: ['800x500 mm', '1000x500 mm', '1200x800 mm'], unit: 'mm', required: true },
              { name: 'Lifting Height', type: 'dropdown', options: ['1.0 m', '1.5 m', '2.0 m'], unit: 'm', required: true }
            ]
          },
          {
            name: 'Electric',
            specifications: [
              { name: 'Load Capacity', type: 'dropdown', options: ['500 kg', '1000 kg', '1500 kg'], unit: 'kg', required: true },
              { name: 'Platform Size', type: 'dropdown', options: ['1000x500 mm', '1200x800 mm', '1500x1000 mm'], unit: 'mm', required: true },
              { name: 'Lifting Height', type: 'dropdown', options: ['1.5 m', '2.0 m', '3.0 m'], unit: 'm', required: true },
              { name: 'Battery Type', type: 'dropdown', options: ['Lead Acid', 'Lithium-ion'], required: true }
            ]
          }
        ]
      },
      {
        name: 'Drum Picker',
        type: 'Trading',
        company: company._id,
        subCategories: [
          {
            name: 'Manual',
            specifications: [
              { name: 'Load Capacity', type: 'dropdown', options: ['300 kg', '400 kg', '500 kg'], unit: 'kg', required: true },
              { name: 'Drum Size', type: 'dropdown', options: ['200 L', '210 L'], unit: 'L', required: true },
              { name: 'Lifting Height', type: 'dropdown', options: ['1.5 m', '2.0 m'], unit: 'm', required: true }
            ]
          },
          {
            name: 'Electric',
            specifications: [
              { name: 'Load Capacity', type: 'dropdown', options: ['400 kg', '500 kg'], unit: 'kg', required: true },
              { name: 'Drum Size', type: 'dropdown', options: ['200 L', '210 L'], unit: 'L', required: true },
              { name: 'Lifting Height', type: 'dropdown', options: ['1.5 m', '2.0 m', '2.5 m'], unit: 'm', required: true },
              { name: 'Battery Type', type: 'dropdown', options: ['Lead Acid', 'Lithium-ion'], required: true }
            ]
          }
        ]
      }
    ];
    
    // Clear existing categories
    await ProductCategory.deleteMany({ company: company._id });
    console.log('\n🗑️  Cleared existing categories');
    
    // Insert new categories
    const result = await ProductCategory.insertMany(tradingCategories);
    console.log(`\n✅ Created ${result.length} product categories:`);
    
    result.forEach(cat => {
      console.log(`\n📦 ${cat.name} (${cat.type})`);
      cat.subCategories.forEach(sub => {
        console.log(`   └─ ${sub.name}`);
        console.log(`      Specifications: ${sub.specifications.map(s => s.name).join(', ')}`);
      });
    });
    
    mongoose.connection.close();
    console.log('\n✅ Setup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

setupCategories();
