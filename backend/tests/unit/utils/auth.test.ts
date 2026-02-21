import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../src/utils/auth';
import { authMiddleware } from '../../../src/middleware/auth';
import { db } from '../../../src/db/client';
import { users } from '../../../src/db/schema';
import { eq } from 'drizzle-orm';

let testUserId: string;

// Mock environment variables
beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';

  // Create a test user for middleware tests
  const [user] = await db
    .insert(users)
    .values({
      email: `test${Date.now()}@example.com`,
      password_hash: 'hashedpassword',
      name: 'Test User',
    })
    .returning({ id: users.id });
  testUserId = user.id;
});

afterAll(async () => {
  // Clean up test user
  if (testUserId) {
    await db.delete(users).where(eq(users.id, testUserId));
  }
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
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const token = await signAccessToken(userId);
    const payload = await verifyAccessToken(token);
    expect(payload.userId).toBe(userId);
    expect(payload.type).toBe('access');
  });

  it('should sign and verify refresh token', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
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
  // Note: authMiddleware is now an Elysia plugin (.derive()), not a direct function
  // Integration tests in tests/integration/auth.test.ts cover the middleware behavior
  // This is a placeholder to note the architectural change

  it('should be an Elysia plugin instance', () => {
    expect(authMiddleware).toBeDefined();
    expect(typeof authMiddleware.handle).toBe('function');
  });
});
