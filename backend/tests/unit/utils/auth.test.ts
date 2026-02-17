import { describe, it, expect, beforeAll } from 'bun:test';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../src/utils/auth';
import { authMiddleware } from '../../../src/middleware/auth';

// Mock environment variables
beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';
});

describe('Password Utilities', () => {
  it('should hash password correctly', async () => {
    const password = 'testPassword123';
    const hash = await hashPassword(password);
    expect(hash).toStartWith('$2b$10$'); // bcrypt format
  });

  it('should verify correct password', async () => {
    const password = 'testPassword123';
    const hash = await hashPassword(password);
    const isValid = await comparePassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'testPassword123';
    const hash = await hashPassword(password);
    const isValid = await comparePassword('wrongPassword', hash);
    expect(isValid).toBe(false);
  });
});

describe('JWT Utilities', () => {
  it('should sign and verify access token', async () => {
    const userId = 'user-123';
    const token = await signAccessToken(userId);
    const payload = await verifyAccessToken(token);
    expect(payload.userId).toBe(userId);
    expect(payload.type).toBe('access');
  });

  it('should sign and verify refresh token', async () => {
    const userId = 'user-123';
    const token = await signRefreshToken(userId);
    const payload = await verifyRefreshToken(token);
    expect(payload.userId).toBe(userId);
    expect(payload.type).toBe('refresh');
  });

  it('should reject invalid access token', async () => {
    await expect(verifyAccessToken('invalid-token')).rejects.toThrow();
  });

  it('should reject invalid refresh token', async () => {
    await expect(verifyRefreshToken('invalid-token')).rejects.toThrow();
  });
});

describe('Authentication Middleware', () => {
  it('should return userId for valid token', async () => {
    const userId = 'user-123';
    const token = await signAccessToken(userId);
    const ctx = {
      request: {
        headers: {
          get: (key: string) =>
            key === 'authorization' ? `Bearer ${token}` : null,
        },
      },
    };
    const result = await authMiddleware(ctx);
    expect(result).toHaveProperty('userId', userId);
  });

  it('should return 401 for missing authorization header', async () => {
    const ctx = {
      request: {
        headers: {
          get: () => null,
        },
      },
    };
    const result = await authMiddleware(ctx);
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('status', 401);
  });

  it('should return 401 for invalid token', async () => {
    const ctx = {
      request: {
        headers: {
          get: (key: string) =>
            key === 'authorization' ? 'Bearer invalid-token' : null,
        },
      },
    };
    const result = await authMiddleware(ctx);
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('status', 401);
  });

  it('should return 401 for missing Bearer prefix', async () => {
    const ctx = {
      request: {
        headers: {
          get: (key: string) =>
            key === 'authorization' ? 'invalid-token' : null,
        },
      },
    };
    const result = await authMiddleware(ctx);
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('status', 401);
  });
});
