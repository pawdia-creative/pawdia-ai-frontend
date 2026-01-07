import { describe, it, expect } from 'vitest';
import { normalizeUser, isUserVerified, isUserAdmin, DbUser } from '../dataTransformers';
import { User } from '@/types/auth';

describe('Data Transformers', () => {
  describe('normalizeUser', () => {
    it('should convert database user to frontend user', () => {
      const dbUser: DbUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        credits: 100,
        is_verified: 1,
        is_admin: 0,
        created_at: '2024-01-01T00:00:00Z'
      };

      const result = normalizeUser(dbUser);

      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        credits: 100,
        isVerified: true,
        isAdmin: false,
        createdAt: '2024-01-01T00:00:00Z'
      });
    });

    it('should handle null input', () => {
      const result = normalizeUser(null);
      expect(result).toBeNull();
    });

    it('should convert boolean values correctly', () => {
      const dbUser: DbUser = {
        id: '123',
        email: 'admin@example.com',
        name: 'Admin User',
        credits: 500,
        is_verified: 0,
        is_admin: 1,
        created_at: '2024-01-01T00:00:00Z'
      };

      const result = normalizeUser(dbUser);

      expect(result?.isVerified).toBe(false);
      expect(result?.isAdmin).toBe(true);
    });
  });

  describe('isUserVerified', () => {
    it('should check verification status from frontend user', () => {
      const user: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test',
        credits: 10,
        isVerified: true,
        isAdmin: false,
        createdAt: '2024-01-01T00:00:00Z'
      };

      expect(isUserVerified(user)).toBe(true);
    });

    it('should check verification status from database user', () => {
      const dbUser: DbUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test',
        credits: 10,
        is_verified: 1,
        is_admin: 0,
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(isUserVerified(dbUser)).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isUserVerified(null)).toBe(false);
      expect(isUserVerified(undefined)).toBe(false);
    });
  });

  describe('isUserAdmin', () => {
    it('should check admin status from frontend user', () => {
      const user: User = {
        id: '123',
        email: 'admin@example.com',
        name: 'Admin',
        credits: 100,
        isVerified: true,
        isAdmin: true,
        createdAt: '2024-01-01T00:00:00Z'
      };

      expect(isUserAdmin(user)).toBe(true);
    });

    it('should check admin status from database user', () => {
      const dbUser: DbUser = {
        id: '123',
        email: 'admin@example.com',
        name: 'Admin',
        credits: 100,
        is_verified: 1,
        is_admin: 1,
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(isUserAdmin(dbUser)).toBe(true);
    });
  });
});
