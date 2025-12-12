import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const defaultProducts = [
  {
    name: 'Canvas Print',
    description: 'Premium gallery-quality canvas',
    price: 49.99,
    displayPrice: '$49.99',
    image: '🖼️',
    sizes: ['8×10', '12×16', '16×20', '20×24'],
    isActive: true,
    displayOrder: 1,
    category: 'general'
  },
  {
    name: 'T-Shirt',
    description: '100% cotton premium tee',
    price: 29.99,
    displayPrice: '$29.99',
    image: '👕',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    isActive: true,
    displayOrder: 2,
    category: 'general'
  },
  {
    name: 'Coffee Mug',
    description: 'Ceramic mug with full-wrap print',
    price: 19.99,
    displayPrice: '$19.99',
    image: '☕',
    sizes: ['11oz', '15oz'],
    isActive: true,
    displayOrder: 3,
    category: 'general'
  },
  {
    name: 'Throw Pillow',
    description: 'Soft decorative pillow cover',
    price: 34.99,
    displayPrice: '$34.99',
    image: '🛏️',
    sizes: ['16×16', '18×18', '20×20'],
    isActive: true,
    displayOrder: 4,
    category: 'general'
  },
  {
    name: 'Tote Bag',
    description: 'Durable canvas tote bag',
    price: 24.99,
    displayPrice: '$24.99',
    image: '👜',
    sizes: ['Standard'],
    isActive: true,
    displayOrder: 5,
    category: 'general'
  },
  {
    name: 'Phone Case',
    description: 'Protective phone case with print',
    price: 22.99,
    displayPrice: '$22.99',
    image: '📱',
    sizes: ['iPhone 15', 'Samsung S23', 'Google Pixel 8'],
    isActive: true,
    displayOrder: 6,
    category: 'general'
  }
];

async function seedProducts() {
  try {
    console.log('🌱 Starting product data migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');
    
    // Insert default products
    const products = await Product.insertMany(defaultProducts);
    console.log(`✅ Successfully seeded ${products.length} products:`);
    
    products.forEach(product => {
      console.log(`   - ${product.name} (${product.displayPrice})`);
    });
    
    console.log('🎉 Product data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedProducts();