import connectDB from '../config/d1-database.js';

class D1Product {
  constructor(data) {
    this.id = data?.id;
    this.name = data?.name || '';
    this.description = data?.description || '';
    this.price = data?.price || 0;
    this.displayPrice = data?.displayPrice || '$0.00';
    this.image = data?.image || '';
    this.sizes = data?.sizes || [];
    this.isActive = data?.isActive !== undefined ? data.isActive : true;
    this.displayOrder = data?.displayOrder || 0;
    this.category = data?.category || 'general';
    this.createdAt = data?.createdAt || new Date().toISOString();
    this.updatedAt = data?.updatedAt || new Date().toISOString();
  }

  // Create a new product
  static async create(productData) {
    try {
      const db = await connectDB.connect();
      
      const result = await db.prepare(`
        INSERT INTO products (name, description, price, displayPrice, image, sizes, isActive, displayOrder, category, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        productData.name,
        productData.description,
        productData.price,
        productData.displayPrice,
        productData.image,
        JSON.stringify(productData.sizes),
        productData.isActive ? 1 : 0,
        productData.displayOrder,
        productData.category,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
      
      if (result.changes > 0 && result.lastInsertRowid) {
        const product = await this.findById(result.lastInsertRowid);
        return product;
      }
      
      throw new Error(`Failed to create product: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Find product by ID
  static async findById(id) {
    try {
      const db = await connectDB.connect();
      
      const result = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).all();
      
      if (result && Array.isArray(result) && result.length > 0) {
        const row = result[0];
        return new D1Product({
          ...row,
          sizes: JSON.parse(row.sizes || '[]'),
          isActive: row.isActive === 1
        });
      }
      
      return null;
    } catch (error) {
      console.error('Error finding product by ID:', error);
      throw error;
    }
  }

  // Find all products
  static async findAll() {
    try {
      const db = await connectDB.connect();
      
      const result = await db.prepare('SELECT * FROM products ORDER BY displayOrder ASC, name ASC').all();
      
      if (!result || !result.results) {
        return [];
      }
      
      return result.results.map(row => new D1Product({
        ...row,
        sizes: JSON.parse(row.sizes || '[]'),
        isActive: row.isActive === 1
      }));
    } catch (error) {
      console.error('Error finding all products:', error);
      throw error;
    }
  }

  // Find active products
  static async findActive() {
    try {
      const db = await connectDB.connect();
      
      const result = await db.prepare('SELECT * FROM products WHERE isActive = 1 ORDER BY displayOrder ASC, name ASC').all();
      
      return result.results.map(row => new D1Product({
        ...row,
        sizes: JSON.parse(row.sizes || '[]'),
        isActive: row.isActive === 1
      }));
    } catch (error) {
      console.error('Error finding active products:', error);
      throw error;
    }
  }

  // Update product
  async update(updateData) {
    try {
      const db = await connectDB.connect();
      
      const result = await db.prepare(`
        UPDATE products 
        SET name = ?, description = ?, price = ?, displayPrice = ?, image = ?, sizes = ?, isActive = ?, displayOrder = ?, category = ?, updatedAt = ?
        WHERE id = ?
      `).bind(
        updateData.name || this.name,
        updateData.description || this.description,
        updateData.price !== undefined ? updateData.price : this.price,
        updateData.displayPrice || this.displayPrice,
        updateData.image || this.image,
        JSON.stringify(updateData.sizes || this.sizes),
        updateData.isActive !== undefined ? (updateData.isActive ? 1 : 0) : (this.isActive ? 1 : 0),
        updateData.displayOrder !== undefined ? updateData.displayOrder : this.displayOrder,
        updateData.category || this.category,
        new Date().toISOString(),
        this.id
      ).run();

      if (result.success) {
        // Update local instance
        Object.assign(this, updateData);
        this.updatedAt = new Date().toISOString();
        return this;
      }
      
      throw new Error('Failed to update product');
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Delete product
  async delete() {
    try {
      const db = await connectDB.connect();
      
      const result = await db.prepare('DELETE FROM products WHERE id = ?').bind(this.id).run();
      
      return result.success;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Delete all products
  static async deleteAll() {
    try {
      const db = await connectDB.connect();
      
      const result = await db.prepare('DELETE FROM products').run();
      
      return result.success;
    } catch (error) {
      console.error('Error deleting all products:', error);
      throw error;
    }
  }

  // Initialize products table
  static async initTable() {
    try {
      const db = await connectDB.connect();
      
      await db.exec(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          displayPrice TEXT NOT NULL,
          image TEXT,
          sizes TEXT,
          isActive INTEGER DEFAULT 1,
          displayOrder INTEGER DEFAULT 0,
          category TEXT DEFAULT 'general',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);
      
      console.log('✅ Products table initialized');
      return true;
    } catch (error) {
      console.error('Error initializing products table:', error);
      throw error;
    }
  }
}

export default D1Product;