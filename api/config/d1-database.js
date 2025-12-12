// Cloudflare D1 Database Configuration
class D1Database {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  // Connect to D1 database
  async connect(env) {
    try {
      // Use Cloudflare D1 binding directly
      if (env && env.DB) {
        this.db = env.DB;
        this.isConnected = true;
        console.log('✅ Connected to Cloudflare D1 database');
        return this.db;
      }
      
      throw new Error('D1 database binding not available');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  // Get database instance
  getDB() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.db) {
        return { status: 'disconnected', message: 'Database not connected' };
      }
      
      // Simple query to test connection
      const result = await this.db.prepare('SELECT 1 as test').first();
      return { 
        status: 'connected', 
        message: 'Database is healthy',
        testResult: result 
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: 'Database health check failed',
        error: error.message 
      };
    }
  }
}

// Create singleton instance
export default new D1Database();