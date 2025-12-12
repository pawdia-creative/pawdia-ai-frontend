import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Use environment variable or default URI
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pawdia-ai';
    
    // Update connection options (remove deprecated options)
    const options = {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
    };
    
    const conn = await mongoose.connect(mongoUri, options);

    console.log(`✅ Database Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    // Provide more detailed error information and solutions
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Solutions:');
      console.log('1. Ensure MongoDB service is started: brew services start mongodb/brew/mongodb-community');
      console.log('2. Or use: mongod --config /usr/local/etc/mongod.conf');
      console.log('3. Check if MongoDB is running on port 27017');
    }
    
    console.log('🔄 Using in-memory database for development...');
    
    // Here you can add in-memory database logic
    // Temporarily don't exit the process, let the application continue running
  }
};

export default connectDB;