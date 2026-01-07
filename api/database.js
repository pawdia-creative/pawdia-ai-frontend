// Database helper functions for D1

// Get user by email
export async function getUserByEmail(db, email) {
  try {
    const result = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    return result;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Get user by ID
export async function getUserById(db, id) {
  try {
    const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    return result;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

// Create new user
export async function createUser(db, userData) {
  try {
    const { id, email, name, password_hash } = userData;
    // Note: D1 users table uses `password` column for stored password hash
    const result = await db.prepare(
      'INSERT INTO users (id, email, name, password, credits) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, email, name, password_hash, 0).run(); // New users start with 0 credits

    return result.success;
  } catch (error) {
    console.error('Error creating user:', error);
    return false;
  }
}

// Set email verification token and expiry for a user
export async function setVerificationToken(db, userId, token, expiresAt) {
  try {
    const result = await db.prepare(
      'UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?'
    ).bind(token, expiresAt, userId).run();
    return result.success === true;
  } catch (error) {
    console.error('Error setting verification token:', error);
    return false;
  }
}

// Verify user using token: mark is_verified = true and clear token fields
export async function verifyUserByToken(db, token) {
  try {
    const now = new Date().toISOString();
    // Check token and expiry
    const row = await db.prepare('SELECT id, verification_expires FROM users WHERE verification_token = ?').bind(token).first();
    if (!row) return { success: false, reason: 'not_found' };
    if (row.verification_expires && new Date(row.verification_expires) < new Date()) {
      return { success: false, reason: 'expired' };
    }
    const result = await db.prepare(
      'UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE verification_token = ?'
    ).bind(token).run();
    if (result.success !== true) return { success: false, reason: 'error' };
    // Fetch the updated user
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(row.id).first();
    return { success: true, user };
  } catch (error) {
    console.error('Error verifying user by token:', error);
    return { success: false, reason: 'error' };
  }
}

// Update user credits
export async function updateUserCredits(db, userId, credits) {
  try {
    const result = await db.prepare(
      'UPDATE users SET credits = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(credits, userId).run();

    return result.success;
  } catch (error) {
    console.error('Error updating user credits:', error);
    return false;
  }
}

// Get users with pagination for admin
export async function getUsersPaginated(db, page = 1, limit = 50, searchTerm = '') {
  try {
    // Ensure valid parameters
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit) || 50)); // Max 100 per page
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, email, avatar, credits, is_verified, is_admin, created_at
      FROM users
      WHERE 1=1
    `;
    let params = [];
    let countParams = [];

    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`;
      query += ' AND (email LIKE ? OR name LIKE ?)';
      params.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Get paginated results
    const result = await db.prepare(query).bind(...params).all();

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    if (searchTerm && searchTerm.trim()) {
      countQuery += ' AND (email LIKE ? OR name LIKE ?)';
    }
    const countResult = await db.prepare(countQuery).bind(...countParams).first();

    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      users: result.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting paginated users:', error);
    return {
      users: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  }
}

// Backward compatibility - deprecated, use getUsersPaginated instead
export async function getAllUsers(db, searchTerm = '') {
  const result = await getUsersPaginated(db, 1, 1000, searchTerm);
  return result.users;
}

// Get user statistics for admin dashboard
export async function getUserStats(db) {
  try {
    const queries = await Promise.all([
      // Total users
      db.prepare('SELECT COUNT(*) as total FROM users').first(),
      // Verified users
      db.prepare('SELECT COUNT(*) as verified FROM users WHERE is_verified = 1').first(),
      // Admin users
      db.prepare('SELECT COUNT(*) as admins FROM users WHERE is_admin = 1').first(),
      // Recent users (last 30 days)
      db.prepare(`
        SELECT COUNT(*) as recent FROM users
        WHERE created_at >= datetime('now', '-30 days')
      `).first(),
      // Users with credits
      db.prepare('SELECT COUNT(*) as with_credits FROM users WHERE credits > 0').first(),
      // Average credits per user
      db.prepare('SELECT AVG(credits) as avg_credits FROM users').first(),
    ]);

    return {
      total: queries[0]?.total || 0,
      verified: queries[1]?.verified || 0,
      admins: queries[2]?.admins || 0,
      recent: queries[3]?.recent || 0,
      withCredits: queries[4]?.with_credits || 0,
      avgCredits: Math.round(queries[5]?.avg_credits || 0),
      verificationRate: queries[0]?.total > 0
        ? Math.round((queries[1]?.verified || 0) / queries[0]?.total * 100)
        : 0
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      total: 0,
      verified: 0,
      admins: 0,
      recent: 0,
      withCredits: 0,
      avgCredits: 0,
      verificationRate: 0
    };
  }
}

// Bulk update user credits (for admin operations)
export async function bulkUpdateCredits(db, userUpdates) {
  try {
    const results = [];

    for (const update of userUpdates) {
      const { userId, credits, operation = 'set' } = update;

      let query, params;
      if (operation === 'add') {
        query = 'UPDATE users SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params = [credits, userId];
      } else if (operation === 'subtract') {
        query = 'UPDATE users SET credits = MAX(0, credits - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params = [credits, userId];
      } else {
        // Default to set
        query = 'UPDATE users SET credits = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params = [credits, userId];
      }

      const result = await db.prepare(query).bind(...params).run();
      results.push({
        userId,
        success: result.success,
        changes: result.meta?.changes || 0
      });
    }

    return results;
  } catch (error) {
    console.error('Error bulk updating credits:', error);
    throw error;
  }
}

// Get recent user activity
export async function getRecentActivity(db, limit = 50) {
  try {
    const query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.created_at as user_created,
        u.last_login,
        (
          SELECT COUNT(*) FROM images i WHERE i.user_id = u.id
        ) as total_images,
        (
          SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed'
        ) as total_payments,
        (
          SELECT SUM(amount) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed'
        ) as total_spent
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT ?
    `;

    const result = await db.prepare(query).bind(limit).all();
    return result.results || [];
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

// Log analytics event
export async function logAnalyticsEvent(db, eventType, userId = null, data = null, request) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') ||
               request.headers.get('X-Forwarded-For') ||
               request.headers.get('X-Real-IP') ||
               'unknown';

    const userAgent = request.headers.get('User-Agent') || 'unknown';

    await db.prepare(
      // Include created_at using CURRENT_TIMESTAMP to satisfy NOT NULL constraint
      'INSERT INTO analytics (event_type, user_id, data, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(eventType, userId, JSON.stringify(data), ip, userAgent).run();

    return true;
  } catch (error) {
    console.error('Error logging analytics event:', error);
    return false;
  }
}

// Get analytics stats
export async function getAnalyticsStats(db) {
  try {
    // Get total users
    const totalUsersResult = await db.prepare('SELECT COUNT(*) as count FROM users').first();
    const totalUsers = totalUsersResult.count || 0;

    // Get total images
    const totalImagesResult = await db.prepare('SELECT COUNT(*) as count FROM images').first();
    const totalImages = totalImagesResult.count || 0;

    // Get total credits used
    const totalCreditsResult = await db.prepare('SELECT SUM(credits_used) as total FROM images').first();
    const totalCredits = totalCreditsResult.total || 0;

    // Get active subscriptions (users with active subscription)
    const activeSubscriptionsResult = await db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE subscription_status = 'active'"
    ).first();
    const activeSubscriptions = activeSubscriptionsResult.count || 0;

    return {
      totalUsers,
      totalImages,
      totalCredits,
      activeSubscriptions
    };
  } catch (error) {
    console.error('Error getting analytics stats:', error);
    return {
      totalUsers: 0,
      totalImages: 0,
      totalCredits: 0,
      activeSubscriptions: 0
    };
  }
}

// Delete user by ID
export async function deleteUser(db, id) {
  try {
    console.log('Database delete operation for user ID:', id);

    // First check if user exists
    const userExists = await db.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
    if (!userExists) {
      console.warn('User not found for deletion:', id);
      return true; // Consider this successful - user already doesn't exist
    }

    console.log('User exists, proceeding with deletion');

    // Temporarily disable foreign key constraints to avoid issues
    try {
      await db.prepare('PRAGMA foreign_keys = OFF').run();
      console.log('Disabled foreign key constraints');
    } catch (pragmaErr) {
      console.warn('Could not disable foreign keys (continuing):', pragmaErr);
    }

    try {
      console.log('Cleaning up related records...');

      // Delete in reverse order of dependencies
      const analyticsResult = await db.prepare('DELETE FROM analytics WHERE user_id = ?').bind(id).run();
      console.log('Deleted analytics:', analyticsResult?.meta?.changes || 0);

      const paymentsResult = await db.prepare('DELETE FROM payments WHERE user_id = ?').bind(id).run();
      console.log('Deleted payments:', paymentsResult?.meta?.changes || 0);

      const imagesResult = await db.prepare('DELETE FROM images WHERE user_id = ?').bind(id).run();
      console.log('Deleted images:', imagesResult?.meta?.changes || 0);

      console.log('Related records cleanup completed');
    } catch (cleanupErr) {
      console.warn('Cleanup of related records failed:', cleanupErr);
      // Re-enable foreign keys and re-throw
      try {
        await db.prepare('PRAGMA foreign_keys = ON').run();
      } catch (pragmaErr) {
        console.warn('Could not re-enable foreign keys:', pragmaErr);
      }
      throw cleanupErr;
    }

    const result = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    console.log('Database delete result:', result);
    console.log('Result meta:', result?.meta);
    console.log('Changes:', result?.meta?.changes);

    // Re-enable foreign key constraints
    try {
      await db.prepare('PRAGMA foreign_keys = ON').run();
      console.log('Re-enabled foreign key constraints');
    } catch (pragmaErr) {
      console.warn('Could not re-enable foreign keys (non-critical):', pragmaErr);
    }

    // D1 returns changes count in meta.changes
    const changes = result?.meta?.changes;
    console.log('Delete operation changes:', changes);

    if (typeof changes === 'undefined' || changes < 0) {
      throw new Error('Database operation failed or returned invalid result');
    }

    // changes === 0 means no user was found to delete (might be already deleted)
    if (changes === 0) {
      console.warn('No user found to delete with ID:', id);
      // Don't throw error for this case - user might already be deleted
    }
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    console.error('Error details:', error && error.message ? error.message : String(error));
    throw error;
  }
}

// Ensure required schema columns exist, safe to run multiple times.
export async function ensureSchema(db) {
  try {
    const usersInfo = await db.prepare("PRAGMA table_info(users)").all();
    const usersRows = usersInfo && usersInfo.results ? usersInfo.results : usersInfo;
    const usersCols = Array.isArray(usersRows) ? usersRows.map(r => r.name) : [];
    if (!usersCols.includes('last_verification_sent')) {
      await db.prepare("ALTER TABLE users ADD COLUMN last_verification_sent DATETIME").run();
      console.log('Added users.last_verification_sent');
    }

    const analyticsInfo = await db.prepare("PRAGMA table_info(analytics)").all();
    const analyticsRows = analyticsInfo && analyticsInfo.results ? analyticsInfo.results : analyticsInfo;
    const analyticsCols = Array.isArray(analyticsRows) ? analyticsRows.map(r => r.name) : [];
    if (!analyticsCols.includes('data')) {
      await db.prepare("ALTER TABLE analytics ADD COLUMN data TEXT").run();
      console.log('Added analytics.data');
    }
  } catch (err) {
    console.warn('Schema ensure error (non-fatal):', err);
  }
}
