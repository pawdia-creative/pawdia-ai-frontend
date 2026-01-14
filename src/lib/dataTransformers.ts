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
export const normalizeUser = (dbUser: DbUser | User | null | undefined): User | null => {
  if (!dbUser) return null;

      const raw = dbUser as unknown as Record<string, unknown>;

  const id = String(raw['id'] ?? '');
  const email = String(raw['email'] ?? '');
  const name = String(raw['name'] ?? '');
  const avatar = raw['avatar'] ? String(raw['avatar']) : undefined;
  const credits = typeof raw['credits'] === 'number' ? (raw['credits'] as number) : Number(raw['credits'] ?? 0);

  const parseBoolField = (fieldNames: string[]) => {
    for (const f of fieldNames) {
      const v = raw[f];
      if (typeof v === 'boolean') return v;
      if (v === undefined || v === null) continue;
      const s = String(v).toLowerCase();
      if (s === '1' || s === 'true') return true;
      if (s === '0' || s === 'false') return false;
    }
    return false;
  };

  const isVerified = parseBoolField(['isVerified', 'is_verified']);
  const isAdmin = parseBoolField(['isAdmin', 'is_admin']);

  const createdAt = String(raw['createdAt'] ?? raw['created_at'] ?? new Date().toISOString());

  // Subscription normalization: accept both DB flattened fields and already-normalized frontend object
  let subscription: User['subscription'] | undefined = undefined;
  if (raw['subscription'] && typeof raw['subscription'] === 'object') {
    const sub = raw['subscription'] as Record<string, unknown>;
    subscription = {
      plan: sub['plan'] as 'free' | 'basic' | 'premium',
      status: sub['status'] as 'active' | 'expired' | 'cancelled',
      expiresAt: sub['expiresAt'] as string | undefined,
    } as User['subscription'];
  } else if (raw['subscription_plan'] || raw['subscription_status'] || raw['subscription_expires'] || raw['subscription_expires_at']) {
    subscription = {
      plan: raw['subscription_plan'] as 'free' | 'basic' | 'premium',
      status: raw['subscription_status'] as 'active' | 'expired' | 'cancelled',
      expiresAt: String(raw['subscription_expires'] ?? raw['subscription_expires_at'] ?? ''),
        };
    if (subscription.expiresAt === '') delete subscription.expiresAt;
  }

  return {
    id,
    email,
    name,
    ...(avatar ? { avatar } : {}),
    credits,
    isVerified,
    isAdmin,
    createdAt,
    ...(subscription ? { subscription } : {}),
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
