import { describe, it, expect, beforeEach } from 'bun:test';
import { testClient } from '../test-utils';
import { db } from '../../src/db/client';
import { users, sessions } from '../../src/db/schema';
import { comparePassword } from '../../src/utils/auth';
import { eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';

describe('POST /api/v1/auth/register', () => {
  beforeEach(async () => {
    // Clean database to ensure test isolation
    await db.delete(sessions);
    await db.delete(users);
  });
  it('should create user successfully', async () => {
    const response = await testClient.post('/api/v1/auth/register').json({
      email: 'success@example.com',
      password: 'SecurePass123',
      name: 'Test User',
      terms_accepted: true,
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe('success@example.com');
    expect(data.data.access_token).toBeDefined();
    expect(data.data.refresh_token).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    // First registration
    await testClient.post('/api/v1/auth/register').json({
      email: 'duplicate@example.com',
      password: 'SecurePass123',
      name: 'Test User',
      terms_accepted: true,
    });

    // Second registration with same email
    const response = await testClient.post('/api/v1/auth/register').json({
      email: 'duplicate@example.com',
      password: 'SecurePass456',
      name: 'Another User',
      terms_accepted: true,
    });

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error.code).toBe('EMAIL_EXISTS');
  });

  it('should reject invalid email', async () => {
    const response = await testClient.post('/api/v1/auth/register').json({
      email: 'invalid-email',
      password: 'SecurePass123',
      name: 'Test User',
      terms_accepted: true,
    });

    expect(response.status).toBe(422);
  });

  it('should reject weak password', async () => {
    const response = await testClient.post('/api/v1/auth/register').json({
      email: 'weak@example.com',
      password: 'weak',
      name: 'Test User',
      terms_accepted: true,
    });

    expect(response.status).toBe(422);
  });

  it('should reject terms not accepted', async () => {
    const response = await testClient.post('/api/v1/auth/register').json({
      email: 'no-terms@example.com',
      password: 'SecurePass123',
      name: 'Test User',
      terms_accepted: false,
    });

    expect(response.status).toBe(422);
  });

  it('should hash password correctly', async () => {
    const password = 'SecurePass123';
    const response = await testClient.post('/api/v1/auth/register').json({
      email: 'hash@example.com',
      password,
      name: 'Hash Test',
      terms_accepted: true,
    });

    expect(response.status).toBe(201);

    const user = await db.query.users.findFirst({
      where: eq(users.email, 'hash@example.com'),
    });

    expect(user).toBeDefined();
    expect(user!.password_hash).not.toBe(password);
    const isValid = await comparePassword(password, user!.password_hash);
    expect(isValid).toBe(true);
  });

  it('should store refresh token hash in sessions', async () => {
    const response = await testClient.post('/api/v1/auth/register').json({
      email: 'session@example.com',
      password: 'SecurePass123',
      name: 'Session Test',
      terms_accepted: true,
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    const refreshToken = data.data.refresh_token;
    const expectedHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token_hash, expectedHash),
    });

    expect(session).toBeDefined();
    expect(session!.user_id).toBeDefined();
  });
});
