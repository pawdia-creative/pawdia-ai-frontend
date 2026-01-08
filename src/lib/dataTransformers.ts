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
    // Accept multiple truthy representations from backend (number or string)
    // Normalize various backend representations (number, string, boolean)
    isVerified: ((): boolean => {
      const v = (dbUser as any).is_verified;
      if (v === undefined || v === null) return false;
      const s = String(v).toLowerCase();
      return s === '1' || s === 'true';
    })(),
    isAdmin: ((): boolean => {
      const v = (dbUser as any).is_admin;
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
  delete (dbUser as any).isVerified;
  delete (dbUser as any).isAdmin;
  delete (dbUser as any).createdAt;
  // Map subscription back to DB fields if present
  if ((user as any).subscription) {
    const sub = (user as any).subscription;
    dbUser.subscription_plan = sub.plan;
    dbUser.subscription_status = sub.status;
    dbUser.subscription_expires = sub.expiresAt;
  }
  delete (dbUser as any).subscription;

  return dbUser;
};

/**
 * Type guard to check if a value is a valid User
 */
export const isUser = (value: any): value is User => {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string' &&
    typeof value.credits === 'number'
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
    const val = (user as any).is_verified;
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
    const val = (user as any).is_admin;
    if (val === undefined || val === null) return false;
    const s = String(val).toLowerCase();
    return s === '1' || s === 'true';
  }

  return false;
};
