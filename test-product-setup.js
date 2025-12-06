require('dotenv').config();
const mongoose = require('mongoose');
const ProductCategory = require('./models/ProductCategory');
const Product = require('./models/Product');
const Company = require('./models/Company');

const testProductSetup = async () => {
  try {
    console.log('🔍 Testing Product Management Setup...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Check Company
    const company = await Company.findOne({ isActive: true });
    if (!company) {
      console.log('❌ No company found');
      process.exit(1);
    }
    console.log(`✅ Company Found: ${company.businessName}`);
    console.log(`   Company ID: ${company._id}\n`);

    // Test 2: Check Product Categories
    const categories = await ProductCategory.find({
      company: company._id,
      type: 'Trading',
      isActive: true
    });
    
    console.log(`📦 Product Categories: ${categories.length} found`);
    categories.forEach(cat => {
      console.log(`   ✅ ${cat.name}`);
      console.log(`      Sub-categories: ${cat.subCategories.length}`);
      cat.subCategories.forEach(sub => {
        console.log(`         - ${sub.name} (${sub.specifications.length} specs)`);
      });
    });
    console.log('');

    // Test 3: Check Pallet Truck Category Details
    const palletTruck = categories.find(c => c.name === 'Pallet Truck');
    if (palletTruck) {
      console.log('🔍 Detailed Check: Pallet Truck Category');
      console.log(`   Category ID: ${palletTruck._id}`);
      console.log(`   Type: ${palletTruck.type}`);
      console.log(`   Sub-categories: ${palletTruck.subCategories.length}`);
      
      const manual = palletTruck.subCategories.find(s => s.name === 'Manual');
      if (manual) {
        console.log('\n   Manual Sub-category Specifications:');
        manual.specifications.forEach(spec => {
          console.log(`      - ${spec.name} (${spec.type})`);
          if (spec.options && spec.options.length > 0) {
            console.log(`        Options: ${spec.options.join(', ')}`);
          }
        });
      }
    }
    console.log('');

    // Test 4: Check Existing Products
    const products = await Product.find({
      company: company._id,
      isActive: true
    });
    
    console.log(`📦 Existing Products: ${products.length} found`);
    if (products.length > 0) {
      products.forEach(product => {
        console.log(`   ✅ ${product.name}`);
        console.log(`      Type: ${product.type}`);
        console.log(`      Category: ${product.category}`);
        console.log(`      Sub-category: ${product.subCategory}`);
        console.log(`      Price: ₹${product.price}`);
        if (product.specifications) {
          console.log(`      Specifications:`);
          for (const [key, value] of product.specifications) {
            console.log(`         - ${key}: ${value}`);
          }
        }
        console.log('');
      });
    } else {
      console.log('   ℹ️  No products added yet. Use the dashboard to add products.\n');
    }

    // Test 5: Verify All Required Categories
    const requiredCategories = ['Pallet Truck', 'Stacker', 'Scissor Lift', 'Drum Picker'];
    const missingCategories = requiredCategories.filter(
      req => !categories.find(cat => cat.name === req)
    );
    
    if (missingCategories.length > 0) {
      console.log('⚠️  Missing Categories:');
      missingCategories.forEach(cat => console.log(`   - ${cat}`));
      console.log('\n   Run: node setup-trading-products.js\n');
    } else {
      console.log('✅ All required categories are present\n');
    }

    // Test 6: Verify Sub-categories
    console.log('🔍 Verifying Sub-categories:');
    const expectedSubCategories = {
      'Pallet Truck': ['Manual', 'Semi Electric', 'Fully Electric'],
      'Stacker': ['Manual', 'Semi Electric', 'Fully Electric'],
      'Scissor Lift': ['Manual', 'Electric'],
      'Drum Picker': ['Manual', 'Electric']
    };

    let allSubCategoriesValid = true;
    for (const [catName, expectedSubs] of Object.entries(expectedSubCategories)) {
      const category = categories.find(c => c.name === catName);
      if (category) {
        const actualSubs = category.subCategories.map(s => s.name);
        const missing = expectedSubs.filter(s => !actualSubs.includes(s));
        if (missing.length > 0) {
          console.log(`   ⚠️  ${catName}: Missing ${missing.join(', ')}`);
          allSubCategoriesValid = false;
        } else {
          console.log(`   ✅ ${catName}: All sub-categories present`);
        }
      }
    }
    console.log('');

    // Final Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('                    SUMMARY                            ');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Company: ${company.businessName}`);
    console.log(`Categories: ${categories.length}/4`);
    console.log(`Products: ${products.length}`);
    console.log(`Sub-categories: ${allSubCategoriesValid ? '✅ Valid' : '⚠️  Issues found'}`);
    console.log('═══════════════════════════════════════════════════════');
    
    if (categories.length === 4 && allSubCategoriesValid) {
      console.log('\n🎉 Setup is COMPLETE and READY TO USE!\n');
      console.log('Next Steps:');
      console.log('1. Start frontend: cd lead-dashboard && npm start');
      console.log('2. Login to dashboard');
      console.log('3. Go to Products tab');
      console.log('4. Click "Add New Product"');
      console.log('5. Test the hierarchical form\n');
    } else {
      console.log('\n⚠️  Setup needs attention. Run: node setup-trading-products.js\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing setup:', error);
    process.exit(1);
  }
};

testProductSetup();
