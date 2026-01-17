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

// Full analytics stats for admin dashboard (richer payload expected by frontend)
export async function getFullAnalyticsStats(db) {
  try {
    // Basic aggregates
    const totalUsersRow = await db.prepare('SELECT COUNT(*) as total FROM users').first();
    const totalUsers = totalUsersRow?.total || 0;

    const totalImagesRow = await db.prepare('SELECT COUNT(*) as total FROM images').first();
    const totalGenerations = totalImagesRow?.total || 0;

    const totalCreditsRow = await db.prepare('SELECT SUM(credits_used) as total FROM images').first();
    const totalCreditsUsed = totalCreditsRow?.total || 0;

    // Page views and API calls from analytics table
    const totalPageViewsRow = await db.prepare("SELECT COUNT(*) as cnt FROM analytics WHERE event_type = 'page_view'").first();
    const totalPageViews = totalPageViewsRow?.cnt || 0;

    // Only count API calls related to image generation (exclude auth, admin, etc.)
    const totalApiCallsRow = await db.prepare(`
      SELECT COUNT(*) as cnt FROM analytics
      WHERE event_type = 'api_call'
      AND (
        json_extract(data, '$.endpoint') LIKE '%/generate%' OR
        json_extract(data, '$.endpoint') LIKE '%/subscriptions/credits/use%' OR
        json_extract(data, '$.path') LIKE '%/generate%' OR
        json_extract(data, '$.path') LIKE '%/subscriptions/credits/use%'
      )
    `).first();
    const totalApiCalls = totalApiCallsRow?.cnt || 0;

    const uniqueUsersRow = await db.prepare('SELECT COUNT(DISTINCT user_id) as cnt FROM analytics WHERE user_id IS NOT NULL').first();
    const uniqueUsers = uniqueUsersRow?.cnt || 0;

    const uniqueSessionsRow = await db.prepare('SELECT COUNT(DISTINCT ip_address || "|" || COALESCE(user_agent, "")) as cnt FROM analytics WHERE ip_address IS NOT NULL').first();
    const uniqueSessions = uniqueSessionsRow?.cnt || 0;
    // Active users in last 30 days (based on last_login)
    const activeUsersRow = await db.prepare("SELECT COUNT(*) as cnt FROM users WHERE last_login >= datetime('now', '-30 days')").first();
    const activeUsers = activeUsersRow?.cnt || 0;

    // Top users by activity
    const topUsersRows = await db.prepare(`
      SELECT a.user_id as user_id, COUNT(*) as total_events,
             SUM(CASE WHEN a.event_type = 'page_view' THEN 1 ELSE 0 END) as page_views,
             SUM(CASE WHEN a.event_type = 'api_call' AND (
               json_extract(a.data, '$.endpoint') LIKE '%/generate%' OR
               json_extract(a.data, '$.endpoint') LIKE '%/subscriptions/credits/use%' OR
               json_extract(a.data, '$.path') LIKE '%/generate%' OR
               json_extract(a.data, '$.path') LIKE '%/subscriptions/credits/use%'
             ) THEN 1 ELSE 0 END) as api_calls
      FROM analytics a
      WHERE a.user_id IS NOT NULL
      GROUP BY a.user_id
      ORDER BY total_events DESC
      LIMIT 20
    `).all();

    const topUsers = [];
    for (const r of (topUsersRows.results || [])) {
      const u = await db.prepare('SELECT id, name, email, credits FROM users WHERE id = ?').bind(r.user_id).first();
      // Fallback: prefer real name; if missing use local-part of email; finally fall back to id
      let resolvedName = null;
      if (u?.name) resolvedName = u.name;
      else if (u?.email) {
        try {
          resolvedName = String(u.email).split('@')[0];
        } catch (e) {
          resolvedName = u.email;
        }
      } else {
        resolvedName = u?.id || r.user_id;
      }

      topUsers.push({
        id: u?.id || r.user_id,
        name: resolvedName,
        email: u?.email || null,
        credits: u?.credits || 0,
        user_id: r.user_id,
        total_events: r.total_events || 0,
        page_views: r.page_views || 0,
        api_calls: r.api_calls || 0
      });
    }

    // Daily stats (last 30 days)
    const dailyRows = await db.prepare(`
      SELECT DATE(created_at) as period,
             SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as page_views,
             SUM(CASE WHEN event_type = 'api_call' AND (
               json_extract(data, '$.endpoint') LIKE '%/generate%' OR
               json_extract(data, '$.endpoint') LIKE '%/subscriptions/credits/use%' OR
               json_extract(data, '$.path') LIKE '%/generate%' OR
               json_extract(data, '$.path') LIKE '%/subscriptions/credits/use%'
             ) THEN 1 ELSE 0 END) as api_calls,
             (SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE(a.created_at)) as total_users,
             (SELECT COUNT(*) FROM images WHERE DATE(created_at) = DATE(a.created_at)) as total_generations,
             (SELECT COALESCE(SUM(credits_used),0) FROM images WHERE DATE(created_at) = DATE(a.created_at)) as total_credits_used
      FROM analytics a
      WHERE DATE(created_at) >= DATE('now', '-29 days')
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `).all();

    const dailyStats = (dailyRows.results || []).map(r => ({
      date: r.period,
      period: r.period,
      page_views: r.page_views || 0,
      api_calls: r.api_calls || 0,
      total_users: r.total_users || 0,
      active_users: 0,
      total_generations: r.total_generations || 0,
      total_credits_used: r.total_credits_used || 0
    }));

    // Monthly stats (last 12 months)
    const monthlyRows = await db.prepare(`
      SELECT strftime('%Y-%m', created_at) as period,
             SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as page_views,
             SUM(CASE WHEN event_type = 'api_call' AND (
               json_extract(data, '$.endpoint') LIKE '%/generate%' OR
               json_extract(data, '$.endpoint') LIKE '%/subscriptions/credits/use%' OR
               json_extract(data, '$.path') LIKE '%/generate%' OR
               json_extract(data, '$.path') LIKE '%/subscriptions/credits/use%'
             ) THEN 1 ELSE 0 END) as api_calls
      FROM analytics
      WHERE created_at >= DATE('now', '-11 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY period ASC
    `).all();
    const monthlyStats = (monthlyRows.results || []).map(r => ({
      period: r.period,
      page_views: r.page_views || 0,
      api_calls: r.api_calls || 0
    }));

    // Yearly stats (last 5 years)
    const yearlyRows = await db.prepare(`
      SELECT strftime('%Y', created_at) as period,
             SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as page_views,
             SUM(CASE WHEN event_type = 'api_call' AND (
               json_extract(data, '$.endpoint') LIKE '%/generate%' OR
               json_extract(data, '$.endpoint') LIKE '%/subscriptions/credits/use%' OR
               json_extract(data, '$.path') LIKE '%/generate%' OR
               json_extract(data, '$.path') LIKE '%/subscriptions/credits/use%'
             ) THEN 1 ELSE 0 END) as api_calls
      FROM analytics
      WHERE created_at >= DATE('now', '-5 years')
      GROUP BY strftime('%Y', created_at)
      ORDER BY period ASC
    `).all();
    const yearlyStats = (yearlyRows.results || []).map(r => ({
      period: r.period,
      page_views: r.page_views || 0,
      api_calls: r.api_calls || 0
    }));

    // Aggregate API call breakdowns from analytics table (event_type = 'api_call')
    const apiByEndpointMap = {};
    const apiByStatusMap = {};
    try {
      const apiRows = await db.prepare("SELECT data FROM analytics WHERE event_type = 'api_call'").all();
      for (const row of (apiRows.results || [])) {
        let parsed = null;
        try {
          parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        } catch (e) {
          // ignore parse errors
          parsed = null;
        }
        const endpoint = parsed && parsed.endpoint ? String(parsed.endpoint) : (parsed && parsed.path ? String(parsed.path) : null);
        const status = parsed && (parsed.status || parsed.status_code) ? String(parsed.status || parsed.status_code) : null;
        if (endpoint) {
          apiByEndpointMap[endpoint] = (apiByEndpointMap[endpoint] || 0) + 1;
        }
        if (status) {
          apiByStatusMap[status] = (apiByStatusMap[status] || 0) + 1;
        }
      }
    } catch (e) {
      console.warn('Failed to aggregate api_call analytics:', e);
    }

    const apiByEndpoint = Object.keys(apiByEndpointMap).map(k => ({ endpoint: k, count: apiByEndpointMap[k] })).sort((a,b)=>b.count-a.count);
    const apiByStatus = Object.keys(apiByStatusMap).map(k => ({ status_code: k, count: apiByStatusMap[k] })).sort((a,b)=>b.count-a.count);

    return {
      totalUsers,
      activeUsers,
      totalGenerations,
      totalCreditsUsed,
      totalPageViews,
      totalApiCalls,
      uniqueUsers,
      uniqueSessions,
      apiByEndpoint,
      apiByStatus,
      topUsers,
      dailyStats,
      monthlyStats,
      yearlyStats
    };
  } catch (error) {
    console.error('Error getting full analytics stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalGenerations: 0,
      totalCreditsUsed: 0,
      totalPageViews: 0,
      totalApiCalls: 0,
      uniqueUsers: 0,
      uniqueSessions: 0,
      apiByEndpoint: [],
      apiByStatus: [],
      topUsers: [],
      dailyStats: [],
      monthlyStats: [],
      yearlyStats: []
    };
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
    // Check token and expiry and current verification state
    const row = await db.prepare('SELECT id, verification_expires, is_verified FROM users WHERE verification_token = ?').bind(token).first();
    if (!row) return { success: false, reason: 'not_found' };

    // If already verified, return success (idempotent)
    if (row.is_verified === 1) {
      const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(row.id).first();
      return { success: true, user };
    }

    if (row.verification_expires && new Date(row.verification_expires) < new Date()) {
      return { success: false, reason: 'expired' };
    }

    // Mark user as verified but keep the token/expiry intact so the link remains usable
    const result = await db.prepare(
      'UPDATE users SET is_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE verification_token = ?'
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
    // Clean expired credits before updating
    await cleanExpiredCredits(db);

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

// Clean expired credits for users
export async function cleanExpiredCredits(db) {
  try {
    const result = await db.prepare(`
      UPDATE users
      SET credits = 0, credits_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE credits > 0 AND credits_expires IS NOT NULL AND credits_expires < CURRENT_TIMESTAMP
    `).run();

    if (result.changes > 0) {
      console.log(`Cleaned expired credits for ${result.changes} users`);
    }

    return result.changes;
  } catch (error) {
    console.error('Error cleaning expired credits:', error);
    return 0;
  }
}
