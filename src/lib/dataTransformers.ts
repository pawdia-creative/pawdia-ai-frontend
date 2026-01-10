import { User } from '@/types/auth';

/**
 * Database user record (raw from backend)
 */
export interface DbUser {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  avatar?: string;
  credits: number;
  is_verified?: number; // 0 or 1
  is_admin?: number; // 0 or 1
  verification_token?: string;
  verification_expires?: string;
  last_verification_sent?: string;
  reset_password_token?: string;
  reset_password_expires?: string;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_expires?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Normalizes database user record to frontend User type
 */
export const normalizeUser = (dbUser: DbUser | null): User | null => {
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    ...(dbUser.avatar ? { avatar: dbUser.avatar } : {}),
    credits: dbUser.credits,
    // Accept multiple truthy representations from backend (number/string) OR already-normalized frontend shape (boolean)
    isVerified: ((): boolean => {
      const raw = dbUser as unknown as Record<string, unknown>;
      // Prefer explicit frontend boolean if present
      if (typeof raw['isVerified'] === 'boolean') return raw['isVerified'] as boolean;
      const v = (raw['is_verified'] ?? raw['isVerified']);
      if (v === undefined || v === null) return false;
      const s = String(v).toLowerCase();
      return s === '1' || s === 'true';
    })(),
    isAdmin: ((): boolean => {
      const raw = dbUser as unknown as Record<string, unknown>;
      if (typeof raw['isAdmin'] === 'boolean') return raw['isAdmin'] as boolean;
      const v = (raw['is_admin'] ?? raw['isAdmin']);
      if (v === undefined || v === null) return false;
      const s = String(v).toLowerCase();
      return s === '1' || s === 'true';
    })(),
    createdAt: dbUser.created_at,
    ...(dbUser.subscription_plan ? {
      subscription: (() => {
        const obj: { plan: 'free' | 'basic' | 'premium'; expiresAt?: string; status: 'active' | 'expired' | 'cancelled' } = {
          plan: dbUser.subscription_plan as 'free' | 'basic' | 'premium',
          status: (dbUser.subscription_status as 'active' | 'expired' | 'cancelled') || 'inactive',
        };
        if (dbUser.subscription_expires) obj.expiresAt = dbUser.subscription_expires;
        return obj;
      })()
    } : {}),
  };
};

/**
 * Converts frontend User type to database format for updates
 */
export const denormalizeUser = (user: Partial<User>): Partial<DbUser> => {
  const dbUser: Partial<DbUser> = {
    ...user,
    is_verified: user.isVerified ? 1 : 0,
    is_admin: user.isAdmin ? 1 : 0,
  };

  // Remove frontend-only fields
  const dbObj = dbUser as Partial<Record<string, unknown>>;
  delete dbObj['isVerified'];
  delete dbObj['isAdmin'];
  delete dbObj['createdAt'];
  // Map subscription back to DB fields if present
  const possibleSub = (user as unknown as { subscription?: { plan: string; expiresAt?: string; status: string } } )?.subscription;
  if (possibleSub) {
    dbUser.subscription_plan = possibleSub.plan;
    dbUser.subscription_status = possibleSub.status;
    dbUser.subscription_expires = possibleSub.expiresAt;
  }
  delete dbObj['subscription'];

  return dbUser;
};

/**
 * Type guard to check if a value is a valid User
 */
export const isUser = (value: unknown): value is User => {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>)['id'] === 'string' &&
    typeof (value as Record<string, unknown>)['email'] === 'string' &&
    typeof (value as Record<string, unknown>)['name'] === 'string' &&
    typeof (value as Record<string, unknown>)['credits'] === 'number'
  );
};

/**
 * Safe user verification check that handles both formats
 */
export const isUserVerified = (user: User | DbUser | null | undefined): boolean => {
  if (!user) return false;

  // Check frontend format
  if ('isVerified' in user && typeof user.isVerified === 'boolean') {
    return user.isVerified;
  }

  // Check database format
  if ('is_verified' in user) {
    const val = (user as unknown as Record<string, unknown>)['is_verified'];
    return val === 1 || val === '1' || val === true || val === 'true';
  }

  return false;
};

/**
 * Safe admin check that handles both formats
 */
export const isUserAdmin = (user: User | DbUser | null | undefined): boolean => {
  if (!user) return false;

  // Check frontend format
  if ('isAdmin' in user && typeof user.isAdmin === 'boolean') {
    return user.isAdmin;
  }

  // Check database format
  if ('is_admin' in user) {
    const val = (user as unknown as Record<string, unknown>)['is_admin'];
    if (val === undefined || val === null) return false;
    const s = String(val).toLowerCase();
    return s === '1' || s === 'true';
  }

  return false;
};
