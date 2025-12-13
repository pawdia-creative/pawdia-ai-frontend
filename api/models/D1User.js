import bcrypt from 'bcryptjs';
import d1Database from '../config/d1-database.js';

class D1User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.avatar = data.avatar || null;
    this.credits = data.credits || 3;
    this.subscription = {
      plan: data.subscription_plan || null,
      expiresAt: data.subscription_expires_at || null,
      status: data.subscription_status || null
    };
    this.isVerified = data.is_verified || false;
    this.verificationToken = data.verification_token || null;
    this.resetPasswordToken = data.reset_password_token || null;
    this.resetPasswordExpires = data.reset_password_expires || null;
    this.isAdmin = data.is_admin || false;
    this.lastLogin = data.last_login || null;
    this.createdAt = data.created_at || new Date();
    this.updatedAt = data.updated_at || new Date();
  }

  // Convert to JSON (remove sensitive fields)
  toJSON() {
    const user = { ...this };
    delete user.password;
    delete user.verificationToken;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    return user;
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Static methods for database operations
  static async findOne(query) {
    try {
      const db = d1Database.getDB();
      
      if (query.email) {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const userData = stmt.get(query.email);
        return userData ? new D1User(userData) : null;
      }
      
      if (query.id) {
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const userData = stmt.get(query.id);
        return userData ? new D1User(userData) : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  static async findById(id) {
    return await D1User.findOne({ id });
  }

  static async findByEmail(email) {
    return await D1User.findOne({ email: email.toLowerCase() });
  }

  static async create(userData) {
    try {
      const db = d1Database.getDB();
      
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const stmt = db.prepare(`
        INSERT INTO users (
          name, email, password, avatar, credits, 
          subscription_plan, subscription_expires_at, subscription_status,
          is_verified, verification_token, reset_password_token, reset_password_expires,
          is_admin, last_login
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        userData.name,
        userData.email.toLowerCase(),
        hashedPassword,
        userData.avatar || null,
        userData.credits || 3,
        userData.subscription?.plan || null,
        userData.subscription?.expiresAt || null,
        userData.subscription?.status || null,
        userData.isVerified ? 1 : 0,
        userData.verificationToken || null,
        userData.resetPasswordToken || null,
        userData.resetPasswordExpires || null,
        userData.isAdmin ? 1 : 0,
        userData.lastLogin || null
      );
      
      // Get the created user
      return await D1User.findById(result.lastInsertRowid);
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle unique constraint violation (email already exists)
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Email already exists');
      }
      
      throw error;
    }
  }

  async save() {
    try {
      const db = d1Database.getDB();
      
      // If this is a new user (no id), create it
      if (!this.id) {
        const newUser = await D1User.create({
          name: this.name,
          email: this.email,
          password: this.password,
          avatar: this.avatar,
          credits: this.credits,
          subscription: this.subscription,
          isVerified: this.isVerified,
          verificationToken: this.verificationToken,
          resetPasswordToken: this.resetPasswordToken,
          resetPasswordExpires: this.resetPasswordExpires,
          isAdmin: this.isAdmin,
          lastLogin: this.lastLogin
        });
        
        Object.assign(this, newUser);
        return this;
      }
      
      // Update existing user
      const stmt = db.prepare(`
        UPDATE users SET
          name = ?, email = ?, avatar = ?, credits = ?,
          subscription_plan = ?, subscription_expires_at = ?, subscription_status = ?,
          is_verified = ?, verification_token = ?, reset_password_token = ?, reset_password_expires = ?,
          is_admin = ?, last_login = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(
        this.name,
        this.email.toLowerCase(),
        this.avatar,
        this.credits,
        this.subscription.plan,
        this.subscription.expiresAt,
        this.subscription.status,
        this.isVerified,
        this.verificationToken,
        this.resetPasswordToken,
        this.resetPasswordExpires,
        this.isAdmin,
        this.lastLogin,
        this.id
      );
      
      return this;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    try {
      const user = await D1User.findById(id);
      if (!user) {
        return null;
      }
      
      // Update user fields
      Object.assign(user, updateData);
      
      // Handle password update separately (hash it)
      if (updateData.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(updateData.password, salt);
      }
      
      await user.save();
      
      return options.new ? user : { ...user };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async findByIdAndDelete(id) {
    try {
      const db = d1Database.getDB();
      const user = await D1User.findById(id);
      
      if (!user) {
        return null;
      }
      
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(id);
      
      return user;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async countDocuments(query = {}) {
    try {
      const db = d1Database.getDB();
      
      if (query.isAdmin !== undefined) {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = ?');
        const result = stmt.get(query.isAdmin ? 1 : 0);
        return result.count;
      }
      
      const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
      const result = stmt.get();
      return result.count;
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }

  static async find(query = {}, options = {}) {
    try {
      const db = d1Database.getDB();
      let sql = 'SELECT * FROM users';
      const params = [];
      
      // Build WHERE clause
      const conditions = [];
      
      if (query.isAdmin !== undefined) {
        conditions.push('is_admin = ?');
        params.push(query.isAdmin ? 1 : 0);
      }
      
      if (query.isVerified !== undefined) {
        conditions.push('is_verified = ?');
        params.push(query.isVerified ? 1 : 0);
      }
      
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      
      // Add ORDER BY
      sql += ' ORDER BY created_at DESC';
      
      // Add LIMIT
      if (options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
      }
      
      const stmt = db.prepare(sql);
      const usersData = stmt.all(...params);
      
      return usersData.map(userData => new D1User(userData));
    } catch (error) {
      console.error('Error finding users:', error);
      return [];
    }
  }

  // Get all users (alias for find with no query)
  static async findAll() {
    return await D1User.find();
  }
}

export default D1User;