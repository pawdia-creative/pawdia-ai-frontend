/// <reference types="vitest" />
import { normalizeUser, denormalizeUser, isUserVerified, isUserAdmin } from '../dataTransformers';
import { DbUser } from '../dataTransformers';
import { User } from '@/types/auth';

describe('dataTransformers', () => {
  const dbUser: DbUser = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    credits: 10,
    is_verified: 1,
    is_admin: 0,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    subscription_plan: 'basic',
    subscription_status: 'active',
    subscription_expires: '2024-01-01T00:00:00Z',
  };

  const frontendUser: User = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    credits: 10,
    isVerified: true,
    isAdmin: false,
    createdAt: '2023-01-01T00:00:00Z',
    subscription: {
      plan: 'basic',
      status: 'active',
      expiresAt: '2024-01-01T00:00:00Z',
    },
  };

  it('should normalize DbUser to User correctly', () => {
    const normalized = normalizeUser(dbUser);
    expect(normalized).toEqual(frontendUser);
  });

  it('should denormalize User to DbUser correctly', () => {
    const denormalized = denormalizeUser(frontendUser);
    expect(denormalized).toEqual(expect.objectContaining({
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      credits: 10,
      is_verified: 1,
      is_admin: 0,
      subscription_plan: 'basic',
      subscription_status: 'active',
      subscription_expires: '2024-01-01T00:00:00Z',
    }));
  });

  it('should correctly identify a verified user', () => {
    expect(isUserVerified(dbUser)).toBe(true);
    expect(isUserVerified(frontendUser)).toBe(true);
    const unverifiedDbUser = { ...dbUser, is_verified: 0 };
    expect(isUserVerified(unverifiedDbUser)).toBe(false);
  });

  it('should correctly identify an admin user', () => {
    expect(isUserAdmin(dbUser)).toBe(false);
    expect(isUserAdmin(frontendUser)).toBe(false);
    const adminDbUser = { ...dbUser, is_admin: 1 };
    expect(isUserAdmin(adminDbUser)).toBe(true);
  });
});


