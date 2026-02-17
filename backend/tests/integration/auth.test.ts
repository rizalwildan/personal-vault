import { describe, it, expect, beforeEach } from 'bun:test';
import { testClient } from '../test-utils';
import { db } from '../../src/db/client';
import { users, sessions } from '../../src/db/schema';
import { comparePassword } from '../../src/utils/auth';
import { eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { loginRateLimiter } from '../../src/middleware/rate-limiter';

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

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    // Clean database to ensure test isolation
    await db.delete(sessions);
    await db.delete(users);

    // Reset rate limiters for login tests
    loginRateLimiter.reset('test-login-success-ip');
    loginRateLimiter.reset('test-login-invalid-email-ip');
    loginRateLimiter.reset('test-login-invalid-password-ip');
    loginRateLimiter.reset('test-login-session-ip');
  });

  it('should authenticate user successfully', async () => {
    // Create test user first
    await testClient.post('/api/v1/auth/register').json({
      email: 'login-test@example.com',
      password: 'SecurePass123',
      name: 'Login Test',
      terms_accepted: true,
    });

    const response = await testClient.post('/api/v1/auth/login').json(
      {
        email: 'login-test@example.com',
        password: 'SecurePass123',
      },
      { 'x-real-ip': 'test-login-success-ip' },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe('login-test@example.com');
    expect(data.data.access_token).toBeDefined();
    expect(data.data.refresh_token).toBeDefined();
  });

  it('should reject invalid email', async () => {
    const response = await testClient.post('/api/v1/auth/login').json(
      {
        email: 'nonexistent@example.com',
        password: 'SomePassword123',
      },
      { 'x-real-ip': 'test-login-invalid-email-ip' },
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should reject invalid password', async () => {
    // Create test user
    await testClient.post('/api/v1/auth/register').json({
      email: 'wrong-pass@example.com',
      password: 'CorrectPass123',
      name: 'Wrong Pass Test',
      terms_accepted: true,
    });

    const response = await testClient.post('/api/v1/auth/login').json(
      {
        email: 'wrong-pass@example.com',
        password: 'WrongPass123',
      },
      { 'x-real-ip': 'test-login-invalid-password-ip' },
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should create session record on login', async () => {
    // Create test user
    await testClient.post('/api/v1/auth/register').json({
      email: 'session-login@example.com',
      password: 'SecurePass123',
      name: 'Session Login Test',
      terms_accepted: true,
    });

    const response = await testClient.post('/api/v1/auth/login').json(
      {
        email: 'session-login@example.com',
        password: 'SecurePass123',
      },
      { 'x-real-ip': 'test-login-session-ip' },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    const refreshToken = data.data.refresh_token;
    const expectedHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token_hash, expectedHash),
    });

    expect(session).toBeDefined();
  });
});

describe('POST /api/v1/auth/logout', () => {
  beforeEach(async () => {
    // Clean database to ensure test isolation
    await db.delete(sessions);
    await db.delete(users);

    // Reset rate limiters for logout tests
    loginRateLimiter.reset('test-logout-success-ip');
    loginRateLimiter.reset('test-delete-session-ip');
  });

  it('should logout user successfully', async () => {
    // Reset rate limiter for this test
    loginRateLimiter.reset('test-logout-success-ip');

    // Register and login first
    await testClient.post('/api/v1/auth/register').json({
      email: 'logout-test@example.com',
      password: 'SecurePass123',
      name: 'Logout Test',
      terms_accepted: true,
    });

    const loginResponse = await testClient.post('/api/v1/auth/login').json(
      {
        email: 'logout-test@example.com',
        password: 'SecurePass123',
      },
      { 'x-real-ip': 'test-logout-success-ip' },
    );

    const loginData = await loginResponse.json();
    const { refresh_token } = loginData.data;

    // Now logout
    const logoutResponse = await testClient
      .post('/api/v1/auth/logout')
      .json({ refresh_token });

    expect(logoutResponse.status).toBe(200);
    const data = await logoutResponse.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Logged out successfully');
  });

  it('should reject invalid refresh token', async () => {
    const response = await testClient
      .post('/api/v1/auth/logout')
      .json({ refresh_token: 'invalid-token' });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('INVALID_TOKEN');
  });

  it('should delete session record on logout', async () => {
    // Reset rate limiter for this test's IP
    loginRateLimiter.reset('test-delete-session-ip');

    // Register and login
    await testClient.post('/api/v1/auth/register').json({
      email: 'delete-session@example.com',
      password: 'SecurePass123',
      name: 'Delete Session Test',
      terms_accepted: true,
    });

    const loginResponse = await testClient.post('/api/v1/auth/login').json(
      {
        email: 'delete-session@example.com',
        password: 'SecurePass123',
      },
      { 'x-real-ip': 'test-delete-session-ip' },
    );

    const loginData = await loginResponse.json();
    const { refresh_token } = loginData.data;
    const tokenHash = createHash('sha256').update(refresh_token).digest('hex');

    // Verify session exists
    let session = await db.query.sessions.findFirst({
      where: eq(sessions.token_hash, tokenHash),
    });
    expect(session).toBeDefined();

    // Logout
    await testClient.post('/api/v1/auth/logout').json({ refresh_token });

    // Verify session is deleted
    session = await db.query.sessions.findFirst({
      where: eq(sessions.token_hash, tokenHash),
    });
    expect(session).toBeUndefined();
  });
});

describe('POST /api/v1/auth/login - Rate Limiting', () => {
  beforeEach(async () => {
    // Clean database to ensure test isolation
    await db.delete(sessions);
    await db.delete(users);

    // Reset rate limiter for test IP
    loginRateLimiter.reset('test-ip-1');
    loginRateLimiter.reset('test-ip-2');

    // Create test user for rate limit tests
    await testClient.post('/api/v1/auth/register').json({
      email: 'ratelimit-test@example.com',
      password: 'SecurePass123',
      name: 'Rate Limit Test',
      terms_accepted: true,
    });
  });

  it('should allow up to 5 login attempts from same IP', async () => {
    // Make 5 attempts with wrong password (should all be allowed but fail auth)
    for (let i = 0; i < 5; i++) {
      const response = await testClient
        .post('/api/v1/auth/login')
        .json(
          { email: 'ratelimit-test@example.com', password: 'WrongPassword' },
          { 'x-real-ip': 'test-ip-1' },
        );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
    }
  });

  it('should rate limit after 5 failed login attempts from same IP', async () => {
    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await testClient
        .post('/api/v1/auth/login')
        .json(
          { email: 'ratelimit-test@example.com', password: 'WrongPassword' },
          { 'x-real-ip': 'test-ip-1' },
        );
    }

    // 6th attempt should be rate limited
    const response = await testClient
      .post('/api/v1/auth/login')
      .json(
        { email: 'ratelimit-test@example.com', password: 'WrongPassword' },
        { 'x-real-ip': 'test-ip-1' },
      );

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error.retryAfter).toBeDefined();
  });

  it('should apply rate limiting per IP address', async () => {
    // Make 5 failed attempts from IP 1
    for (let i = 0; i < 5; i++) {
      await testClient
        .post('/api/v1/auth/login')
        .json(
          { email: 'ratelimit-test@example.com', password: 'WrongPassword' },
          { 'x-real-ip': 'test-ip-1' },
        );
    }

    // IP 1 should be rate limited
    const response1 = await testClient
      .post('/api/v1/auth/login')
      .json(
        { email: 'ratelimit-test@example.com', password: 'WrongPassword' },
        { 'x-real-ip': 'test-ip-1' },
      );
    expect(response1.status).toBe(429);

    // IP 2 should still be allowed
    const response2 = await testClient
      .post('/api/v1/auth/login')
      .json(
        { email: 'ratelimit-test@example.com', password: 'SecurePass123' },
        { 'x-real-ip': 'test-ip-2' },
      );
    expect(response2.status).toBe(200);
  });

  it('should count successful login attempts towards rate limit', async () => {
    // Make 5 successful logins
    for (let i = 0; i < 5; i++) {
      const response = await testClient
        .post('/api/v1/auth/login')
        .json(
          { email: 'ratelimit-test@example.com', password: 'SecurePass123' },
          { 'x-real-ip': 'test-ip-1' },
        );
      expect(response.status).toBe(200);
    }

    // 6th attempt should be rate limited
    const response = await testClient
      .post('/api/v1/auth/login')
      .json(
        { email: 'ratelimit-test@example.com', password: 'SecurePass123' },
        { 'x-real-ip': 'test-ip-1' },
      );

    expect(response.status).toBe(429);
  });
});
