import jwt from 'jsonwebtoken';

// Get JWT_SECRET from environment variables
const getJWTSecret = () => {
  const secret = globalThis.env?.JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const JWT_SECRET = getJWTSecret();
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.message.includes('JWT_SECRET')) {
      return res.status(500).json({ message: 'Server configuration error' });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Token verification function for Cloudflare Workers
const verifyToken = async (token) => {
  try {
    const JWT_SECRET = getJWTSecret();
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.message.includes('JWT_SECRET')) {
      throw new Error('Server configuration error: JWT_SECRET not set');
    }
    throw new Error('Invalid or expired token');
  }
};

export { verifyToken };
export default auth;