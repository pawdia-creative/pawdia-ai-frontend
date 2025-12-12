import mongoose from 'mongoose';
import User from '../models/User.js';

// Simple in-memory database for development
const memoryDB = {
  users: [],
  nextId: 1
};

// Memory database user operations
const memoryDBOperations = {
  findUserByEmail: (email) => {
    return memoryDB.users.find(user => user.email === email);
  },
  
  createUser: async (userData) => {
    const user = {
      _id: memoryDB.nextId++,
      ...userData,
      createdAt: new Date(),
      comparePassword: async function(password) {
        return this.password === password;
      }
    };
    memoryDB.users.push(user);
    return user;
  },
  
  findUserById: (id) => {
    return memoryDB.users.find(user => user._id === id);
  },
  
  updateUser: (id, updateData) => {
    const userIndex = memoryDB.users.findIndex(user => user._id === id);
    if (userIndex !== -1) {
      memoryDB.users[userIndex] = {
        ...memoryDB.users[userIndex],
        ...updateData,
        updatedAt: new Date()
      };
      return memoryDB.users[userIndex];
    }
    return null;
  },
  
  deleteUser: (id) => {
    const userIndex = memoryDB.users.findIndex(user => user._id === id);
    if (userIndex !== -1) {
      return memoryDB.users.splice(userIndex, 1)[0];
    }
    return null;
  }
};

// Check if MongoDB is available
const isMongoDBAvailable = async () => {
  try {
    // Check Mongoose connection status
    if (mongoose.connection.readyState === 1) {
      // Connection established, try to execute a simple query
      await User.findOne().limit(1);
      return true;
    }
    return false;
  } catch (error) {
    console.log('MongoDB detection failed, using memory database:', error.message);
    return false;
  }
};

// Database helper functions
const dbHelpers = {
  // Get user (prefer MongoDB, fallback to memory database)
  findUserByEmail: async (email) => {
    const mongoAvailable = await isMongoDBAvailable();
    if (mongoAvailable) {
      return await User.findOne({ email });
    } else {
      return memoryDBOperations.findUserByEmail(email);
    }
  },
  
  // Get user by ID
  findUserById: async (id) => {
    const mongoAvailable = await isMongoDBAvailable();
    if (mongoAvailable) {
      return await User.findById(id);
    } else {
      return memoryDBOperations.findUserById(id);
    }
  },
  
  // Create user
  createUser: async (userData) => {
    const mongoAvailable = await isMongoDBAvailable();
    if (mongoAvailable) {
      const user = new User(userData);
      await user.save();
      return user;
    } else {
      return await memoryDBOperations.createUser(userData);
    }
  },
  
  // Update user
  updateUser: async (id, updateData) => {
    const mongoAvailable = await isMongoDBAvailable();
    if (mongoAvailable) {
      return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    } else {
      return memoryDBOperations.updateUser(id, updateData);
    }
  },
  
  // Delete user
  deleteUser: async (id) => {
    const mongoAvailable = await isMongoDBAvailable();
    if (mongoAvailable) {
      return await User.findByIdAndDelete(id);
    } else {
      const userIndex = memoryDB.users.findIndex(user => user._id === id);
      if (userIndex !== -1) {
        return memoryDB.users.splice(userIndex, 1)[0];
      }
      return null;
    }
  }
};

export { isMongoDBAvailable, memoryDBOperations, dbHelpers };