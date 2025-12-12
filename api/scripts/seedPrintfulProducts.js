import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const printfulProducts = [
  {
    name: 'Premium Hoodie',
    description: 'Premium quality hoodie with your custom design',
    price: 49.99,
    displayPrice: '$49.99',
    image: '🧥',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    isActive: true,
    displayOrder: 100,
    category: 'printful',
    isPrintfulProduct: true,
    printfulProductId: '12345',
    printfulVariantId: '67890',
    externalUrl: 'https://www.printful.com/custom/premium-hoodie/12345/67890'
  },
  {
    name: 'Premium T-Shirt',
    description: 'High-quality cotton t-shirt with your design',
    price: 24.99,
    displayPrice: '$24.99',
    image: '👕',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    isActive: true,
    displayOrder: 101,
    category: 'printful',
    isPrintfulProduct: true,
    printfulProductId: '23456',
    printfulVariantId: '78901',
    externalUrl: 'https://www.printful.com/custom/premium-t-shirt/23456/78901'
  },
  {
    name: 'Ceramic Mug',
    description: '11oz ceramic mug with full-wrap print',
    price: 16.99,
    displayPrice: '$16.99',
    image: '☕',
    sizes: ['11oz'],
    isActive: true,
    displayOrder: 102,
    category: 'printful',
    isPrintfulProduct: true,
    printfulProductId: '34567',
    printfulVariantId: '89012',
    externalUrl: 'https://www.printful.com/custom/ceramic-mug/34567/89012'
  },
  {
    name: 'Poster Print',
    description: 'High-quality poster print on premium paper',
    price: 19.99,
    displayPrice: '$19.99',
    image: '🖼️',
    sizes: ['12×18', '18×24', '24×36'],
    isActive: true,
    displayOrder: 103,
    category: 'printful',
    isPrintfulProduct: true,
    printfulProductId: '45678',
    printfulVariantId: '90123',
    externalUrl: 'https://www.printful.com/custom/poster-print/45678/90123'
  },
  {
    name: 'Phone Case',
    description: 'Protective phone case with your custom design',
    price: 22.99,
    displayPrice: '$22.99',
    image: '📱',
    sizes: ['iPhone 15', 'Samsung S23', 'Google Pixel 8'],
    isActive: true,
    displayOrder: 104,
    category: 'printful',
    isPrintfulProduct: true,
    printfulProductId: '56789',
    printfulVariantId: '01234',
    externalUrl: 'https://www.printful.com/custom/phone-case/56789/01234'
  }
];

async function seedPrintfulProducts() {
  try {
    console.log('🌱 Starting Printful product data seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if Printful products already exist
    const existingPrintfulProducts = await Product.find({ isPrintfulProduct: true });
    
    if (existingPrintfulProducts.length > 0) {
      console.log('ℹ️  Printful products already exist, skipping seeding...');
      return;
    }
    
    // Insert Printful products
    const products = await Product.insertMany(printfulProducts);
    console.log(`✅ Successfully seeded ${products.length} Printful products:`);
    
    products.forEach(product => {
      console.log(`   - ${product.name} (${product.displayPrice}) - ${product.externalUrl}`);
    });
    
    console.log('🎉 Printful product data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding Printful products:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedPrintfulProducts();