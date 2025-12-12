import { validationResult } from 'express-validator';
import User from '../models/User.js';

// Unified validation error handling middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

// Unified error handling middleware
export const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);
  
  // Return different status codes based on error type
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation error', 
      errors: Object.values(error.errors).map(err => err.message) 
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  // Default error handling
  res.status(500).json({ message: 'Internal server error' });
};

// User existence check middleware
export const checkUserExists = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.targetUser = user; // Attach found user to request object
    next();
  } catch (error) {
    next(error);
  }
};