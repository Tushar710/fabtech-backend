require('dotenv').config();
const mongoose = require('mongoose');
const ProductCategory = require('./models/ProductCategory');

const setupTradingCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get the first company ID (you can modify this to use specific company)
    const Company = require('./models/Company');
    const company = await Company.findOne({ isActive: true });
    
    if (!company) {
      console.log('❌ No company found. Please create a company first.');
      process.exit(1);
    }

    console.log(`📦 Setting up categories for company: ${company.businessName}`);

    // Define Trading Product Categories
    const tradingCategories = [
      {
        name: 'Pallet Truck',
        type: 'Trading',
        company: company._id,
        subCategories: [
          {
            name: 'Manual',
            specifications: [
              {
                name: 'Load Capacity',
                type: 'dropdown',
                options: ['1000 kg', '1500 kg', '2000 kg', '2500 kg', '3000 kg'],
                unit: 'kg',
                required: true
              },
              {
                name: 'Fork Width',
                type: 'dropdown',
                options: ['150 mm', '160 mm', '180 mm', '200 mm', '230 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Fork Length',
                type: 'dropdown',
                options: ['800 mm', '900 mm', '1000 mm', '1150 mm', '1200 mm', '1500 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Wheel Type',
                type: 'dropdown',
                options: ['Nylon', 'Polyurethane', 'Rubber', 'Tandem'],
                required: true
              }
            ]
          },
          {
            name: 'Semi Electric',
            specifications: [
              {
                name: 'Load Capacity',
                type: 'dropdown',
                options: ['1000 kg', '1500 kg', '2000 kg', '2500 kg'],
                unit: 'kg',
                required: true
              },
              {
                name: 'Fork Width',
                type: 'dropdown',
                options: ['150 mm', '160 mm', '180 mm', '200 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Fork Length',
                type: 'dropdown',
                options: ['800 mm', '900 mm', '1000 mm', '1150 mm', '1200 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Lift Height',
                type: 'dropdown',
                options: ['200 mm', '800 mm', '1600 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Battery Type',
                type: 'dropdown',
                options: ['Lead Acid', 'Lithium Ion'],
                required: true
              },
              {
                name: 'Battery Voltage',
                type: 'dropdown',
                options: ['12V', '24V'],
                required: true
              }
            ]
          },
          {
            name: 'Fully Electric',
            specifications: [
              {
                name: 'Load Capacity',
                type: 'dropdown',
                options: ['1500 kg', '2000 kg', '2500 kg', '3000 kg'],
                unit: 'kg',
                required: true
              },
              {
                name: 'Fork Width',
                type: 'dropdown',
                options: ['160 mm', '180 mm', '200 mm', '230 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Fork Length',
                type: 'dropdown',
                options: ['900 mm', '1000 mm', '1150 mm', '1200 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Lift Height',
                type: 'dropdown',
                options: ['200 mm', '800 mm', '1600 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Battery Type',
                type: 'dropdown',
                options: ['Lead Acid', 'Lithium Ion'],
                required: true
              },
              {
                name: 'Battery Voltage',
                type: 'dropdown',
                options: ['24V', '48V'],
                required: true
              },
              {
                name: 'Drive Type',
                type: 'dropdown',
                options: ['Walk Behind', 'Ride On'],
                required: true
              }
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
              {
                name: 'Load Capacity',
                type: 'dropdown',
                options: ['1000 kg', '1500 kg', '2000 kg'],
                unit: 'kg',
                required: true
              },
              {
                name: 'Lift Height',
                type: 'dropdown',
                options: ['1600 mm', '2000 mm', '2500 mm', '3000 mm', '3500 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Fork Width',
                type: 'dropdown',
                options: ['150 mm', '160 mm', '180 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Fork Length',
                type: 'dropdown',
                options: ['800 mm', '900 mm', '1000 mm', '1150 mm'],
                unit: 'mm',
                required: true
              }
            ]
          },
          {
            name: 'Semi Electric',
            specifications: [
              {
                name: 'Load Capacity',
                type: 'dropdown',
                options: ['1000 kg', '1500 kg', '2000 kg'],
                unit: 'kg',
                required: true
              },
              {
                name: 'Lift Height',
                type: 'dropdown',
                options: ['1600 mm', '2500 mm', '3000 mm', '3500 mm', '4500 mm', '5000 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Fork Width',
                type: 'dropdown',
                options: ['150 mm', '160 mm', '180 mm', '200 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Fork Length',
                type: 'dropdown',
                options: ['800 mm', '900 mm', '1000 mm', '1150 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Battery Type',
                type: 'dropdown',
                options: ['Lead Acid', 'Lithium Ion'],
                required: true
              }
            ]
          },
          {
            name: 'Fully Electric',
            specifications: [
              {
                name: 'Load Capacity',
                type: 'dropdown',
                options: ['1200 kg', '1500 kg', '2000 kg'],
                unit: 'kg',
                required: true
              },
              {
                name: 'Lift Height',
                type: 'dropdown',
                options: ['3000 mm', '3500 mm', '4500 mm', '5000 mm', '6000 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Fork Width',
                type: 'dropdown',
                options: ['160 mm', '180 mm', '200 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Fork Length',
                type: 'dropdown',
                options: ['900 mm', '1000 mm', '1150 mm', '1200 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Battery Type',
                type: 'dropdown',
                options: ['Lead Acid', 'Lithium Ion'],
                required: true
              },
              {
                name: 'Mast Type',
                type: 'dropdown',
                options: ['Simplex', 'Duplex', 'Triplex'],
                required: true
              }
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
              {
                name: 'Load Capacity',
                type: 'dropdown',
                options: ['300 kg', '500 kg', '1000 kg'],
                unit: 'kg',
                required: true
              },
              {
                name: 'Lift Height',
                type: 'dropdown',
                options: ['800 mm', '1000 mm', '1500 mm', '2000 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Platform Size',
                type: 'dropdown',
                options: ['800x500 mm', '1000x500 mm', '1000x600 mm', '1200x800 mm'],
                unit: 'mm',
                required: true
              }
            ]
          },
          {
            name: 'Electric',
            specifications: [
              {
                name: 'Load Capacity',
                type: 'dropdown',
                options: ['500 kg', '1000 kg', '1500 kg', '2000 kg'],
                unit: 'kg',
                required: true
              },
              {
                name: 'Lift Height',
                type: 'dropdown',
                options: ['1000 mm', '1500 mm', '2000 mm', '3000 mm', '4000 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Platform Size',
                type: 'dropdown',
                options: ['1000x600 mm', '1200x800 mm', '1500x1000 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Battery Type',
                type: 'dropdown',
                options: ['Lead Acid', 'Lithium Ion'],
                required: true
              }
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
              {
                name: 'Load Capacity',
                type: 'dropdown',
                options: ['300 kg', '400 kg', '500 kg'],
                unit: 'kg',
                required: true
              },
              {
                name: 'Lift Height',
                type: 'dropdown',
                options: ['1500 mm', '2000 mm', '2500 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Drum Size',
                type: 'dropdown',
                options: ['200 Ltr', '210 Ltr', '220 Ltr'],
                required: true
              }
            ]
          },
          {
            name: 'Electric',
            specifications: [
              {
                name: 'Load Capacity',
                type: 'dropdown',
                options: ['400 kg', '500 kg', '600 kg'],
                unit: 'kg',
                required: true
              },
              {
                name: 'Lift Height',
                type: 'dropdown',
                options: ['1500 mm', '2000 mm', '2500 mm', '3000 mm'],
                unit: 'mm',
                required: true
              },
              {
                name: 'Drum Size',
                type: 'dropdown',
                options: ['200 Ltr', '210 Ltr', '220 Ltr'],
                required: true
              },
              {
                name: 'Battery Type',
                type: 'dropdown',
                options: ['Lead Acid', 'Lithium Ion'],
                required: true
              }
            ]
          }
        ]
      }
    ];

    // Delete existing Trading categories for this company
    await ProductCategory.deleteMany({
      company: company._id,
      type: 'Trading'
    });
    console.log('🗑️  Cleared existing Trading categories');

    // Insert new categories
    const result = await ProductCategory.insertMany(tradingCategories);
    console.log(`✅ Successfully created ${result.length} Trading product categories`);
    
    result.forEach(cat => {
      console.log(`   📦 ${cat.name} (${cat.subCategories.length} sub-categories)`);
    });

    console.log('\n✅ Setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up categories:', error);
    process.exit(1);
  }
};

setupTradingCategories();
