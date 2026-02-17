# Epic 2: Backend Authentication System

**Status:** Not Started
**Priority:** CRITICAL (Blocking)
**Estimated Duration:** 4-6 days
**Dependencies:** Epic 1 (Foundation & Infrastructure)

---

## Epic Goal

Implement a complete JWT-based authentication system for BMad-Personal-Vault, including user registration, login, logout, token refresh, and session management. This epic creates the security foundation that protects all subsequent API endpoints.

---

## Epic Description

### Context from Architecture

The system uses **custom JWT authentication** with PostgreSQL-backed session management. No external auth providers (OAuth, Auth0) are used to maintain self-hosted privacy requirements (NFR3).

**Authentication Flow:**
1. User registers → Backend creates user record + hashed password
2. User logs in → Backend validates credentials → Issues access token (1h) + refresh token (30d)
3. Authenticated requests → Backend validates JWT access token
4. Token refresh → Backend validates refresh token → Issues new access token
5. Logout → Backend revokes refresh token (adds to session blacklist)

**Security Requirements:**
- Passwords hashed with bcrypt (cost factor 10)
- JWTs signed with HS256 (secret key from env)
- Access tokens short-lived (1 hour) to limit exposure
- Refresh tokens stored as SHA-256 hash in database
- Protected routes require valid JWT in `Authorization: Bearer <token>` header

---

### What This Epic Delivers

1. **Database Schema**
   - `users` table with bcrypt password hashing
   - `sessions` table for refresh token tracking
   - Drizzle ORM models and migrations

2. **Authentication Endpoints**
   - `POST /api/v1/auth/register` - Create new user account
   - `POST /api/v1/auth/login` - Authenticate and issue tokens
   - `POST /api/v1/auth/logout` - Revoke refresh token
   - `POST /api/v1/auth/refresh` - Get new access token
   - `GET /api/v1/auth/me` - Get current user info (protected)

3. **Middleware & Utilities**
   - JWT generation and validation utilities
   - Authentication middleware for protected routes
   - Password hashing utilities
   - Zod schemas for request validation

4. **Testing**
   - Unit tests for JWT utilities
   - Integration tests for auth endpoints
   - Test coverage >80%

---

## Stories

### Story 1: Database Schema for Users and Sessions

**Goal:** Define and migrate database schema for authentication.

**Key Tasks:**
- Create Drizzle schema for `users` table
- Create Drizzle schema for `sessions` table
- Add Zod schemas in `/shared/schemas/user.ts` and `/shared/schemas/session.ts`
- Generate and apply migrations
- Add database indexes for performance

**Acceptance Criteria:**
- [ ] Users table created with fields: id, email (unique), password_hash, name, avatar_url, terms_accepted_at, created_at, updated_at
- [ ] Sessions table created with fields: id, user_id (FK), token_hash (unique), expires_at, created_at
- [ ] Indexes created: users.email, sessions.user_id, sessions.token_hash, sessions.expires_at
- [ ] Migration applied successfully: `bun run db:migrate`
- [ ] Zod schemas exported from `/shared/schemas/`

**Database Schema (users):**
```typescript
// backend/src/db/schema/users.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  avatar_url: varchar('avatar_url', { length: 500 }),
  terms_accepted_at: timestamp('terms_accepted_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

**Zod Schema (shared/schemas/user.ts):**
```typescript
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatar_url: z.string().url().nullable(),
  terms_accepted_at: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z.string().min(1).max(100),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept terms and conditions' })
  }),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type User = z.infer<typeof UserSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
```

---

### Story 2: JWT Utilities and Password Hashing

**Goal:** Create reusable utilities for JWT generation/validation and password hashing.

**Key Tasks:**
- Install dependencies: `bcrypt`, `jsonwebtoken` (or use Bun's built-in JWT)
- Create password hashing utilities (hash, compare)
- Create JWT utilities (sign, verify, decode)
- Create middleware for extracting and validating JWT from request headers
- Write unit tests for all utilities

**Acceptance Criteria:**
- [ ] `hashPassword(plaintext)` returns bcrypt hash (cost factor 10)
- [ ] `comparePassword(plaintext, hash)` validates password correctly
- [ ] `signAccessToken(userId)` generates JWT valid for 1 hour
- [ ] `signRefreshToken(userId)` generates JWT valid for 30 days
- [ ] `verifyToken(token)` validates JWT signature and expiry
- [ ] Middleware extracts JWT from `Authorization: Bearer <token>` header
- [ ] All utilities have >90% test coverage

**Utility Implementation:**
```typescript
// backend/src/utils/auth.ts
import { sign, verify } from 'hono/jwt'; // Or use Bun's JWT

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;

export async function signAccessToken(userId: string): Promise<string> {
  return await sign(
    { userId, type: 'access' },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );
}

export async function signRefreshToken(userId: string): Promise<string> {
  return await sign(
    { userId, type: 'refresh' },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '30d' }
  );
}

export async function verifyAccessToken(token: string) {
  return await verify(token, ACCESS_TOKEN_SECRET);
}

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
}

export async function comparePassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return await Bun.password.verify(plaintext, hash);
}
```

---

### Story 3: User Registration Endpoint

**Goal:** Implement `POST /api/v1/auth/register` endpoint.

**Key Tasks:**
- Create auth routes in `backend/src/routes/auth.ts`
- Implement registration logic with validation
- Hash password before storing
- Create initial session with refresh token
- Return user data + tokens on success
- Handle duplicate email errors

**Acceptance Criteria:**
- [ ] `POST /api/v1/auth/register` accepts JSON body matching `RegisterSchema`
- [ ] Validates email uniqueness (409 Conflict if exists)
- [ ] Validates password complexity (400 Bad Request if weak)
- [ ] Requires `terms_accepted: true` (400 Bad Request if false)
- [ ] Password stored as bcrypt hash (never plaintext)
- [ ] Returns 201 Created with user object + access_token + refresh_token
- [ ] Refresh token stored in sessions table as SHA-256 hash
- [ ] Integration test covers success and error cases

**API Contract:**
```typescript
// POST /api/v1/auth/register
// Request Body
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Developer",
  "terms_accepted": true
}

// Response 201 Created
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Developer",
      "avatar_url": null,
      "terms_accepted_at": "2026-02-16T10:30:00Z",
      "created_at": "2026-02-16T10:30:00Z",
      "updated_at": "2026-02-16T10:30:00Z"
    },
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}

// Error Responses
// 409 Conflict - Email already exists
// 400 Bad Request - Validation errors
```

---

### Story 4: User Login and Logout Endpoints

**Goal:** Implement `POST /api/v1/auth/login` and `POST /api/v1/auth/logout`.

**Key Tasks:**
- Implement login endpoint with credential validation
- Compare password hash using bcrypt
- Issue new access + refresh tokens on successful login
- Store refresh token in sessions table
- Implement logout endpoint to revoke refresh token
- Clean up expired sessions periodically

**Acceptance Criteria:**
- [ ] `POST /api/v1/auth/login` validates credentials
- [ ] Returns 401 Unauthorized for invalid email or password
- [ ] Returns 200 OK with user + tokens on success
- [ ] Creates new session record in sessions table
- [ ] `POST /api/v1/auth/logout` accepts refresh_token in body
- [ ] Logout deletes session from database (token revocation)
- [ ] Returns 200 OK after successful logout
- [ ] Integration tests cover all scenarios

**Login Implementation:**
```typescript
// POST /api/v1/auth/login
app.post('/api/v1/auth/login', async ({ body }) => {
  const { email, password } = LoginSchema.parse(body);

  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } };
  }

  // Verify password
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    return { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } };
  }

  // Generate tokens
  const accessToken = await signAccessToken(user.id);
  const refreshToken = await signRefreshToken(user.id);

  // Store refresh token hash in sessions
  const tokenHash = await Bun.hash(refreshToken, 'sha256');
  await db.insert(sessions).values({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  return {
    success: true,
    data: {
      user: { ...user, password_hash: undefined }, // Don't return password hash
      access_token: accessToken,
      refresh_token: refreshToken,
    },
  };
});
```

---

### Story 5: Token Refresh and Protected Route Middleware

**Goal:** Implement token refresh endpoint and authentication middleware for protected routes.

**Key Tasks:**
- Implement `POST /api/v1/auth/refresh` to issue new access tokens
- Validate refresh token against sessions table
- Create authentication middleware that validates JWT on protected routes
- Implement `GET /api/v1/auth/me` endpoint (protected) to get current user
- Add middleware to Elysia app for route protection
- Handle token expiry and invalid token errors

**Acceptance Criteria:**
- [ ] `POST /api/v1/auth/refresh` accepts refresh_token in body
- [ ] Validates refresh token exists in sessions table
- [ ] Returns new access_token (refresh token remains valid)
- [ ] Returns 401 Unauthorized for invalid/expired refresh tokens
- [ ] Middleware extracts JWT from Authorization header
- [ ] Middleware attaches user object to request context
- [ ] `GET /api/v1/auth/me` returns current user info (requires valid JWT)
- [ ] Protected routes return 401 if no token or invalid token

**Middleware Implementation:**
```typescript
// backend/src/middleware/auth.ts
import { Elysia } from 'elysia';
import { verifyAccessToken } from '../utils/auth';
import { db } from '../db/client';
import { users } from '../db/schema/users';
import { eq } from 'drizzle-orm';

export const authMiddleware = new Elysia()
  .derive(async ({ headers }) => {
    const authorization = headers['authorization'];

    if (!authorization?.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authorization.slice(7);
    const payload = await verifyAccessToken(token);

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      throw new Error('Unauthorized');
    }

    return { currentUser: user };
  });

// Usage in routes
app.use(authMiddleware).get('/api/v1/auth/me', ({ currentUser }) => {
  return {
    success: true,
    data: { user: currentUser },
  };
});
```

---

## Dependencies

**Depends On:**
- ✅ Epic 1: Foundation & Infrastructure (requires database and backend structure)

**Blocks:**
- Epic 3: Backend Notes CRUD (needs authentication for user-scoped notes)
- Epic 5: Frontend Auth Logic (needs working backend auth endpoints)

---

## Risk Mitigation

### Primary Risks

1. **JWT Secret Key Management**
   - Risk: Hardcoded secrets, weak secrets, or exposed secrets in repository
   - Mitigation: Use strong random secrets from `.env`, never commit to git, add `.env` to `.gitignore`
   - Security: Generate secrets with `openssl rand -hex 32`

2. **Password Storage Security**
   - Risk: Weak hashing or plaintext passwords
   - Mitigation: Use bcrypt with cost factor 10 (balance security and performance)
   - Compliance: Meets OWASP password storage guidelines

3. **Session Table Bloat**
   - Risk: Expired sessions accumulate in database
   - Mitigation: Add cleanup job to delete sessions older than 30 days
   - Implementation: Create `scripts/cleanup-sessions.sh` cron job

4. **Token Expiry Edge Cases**
   - Risk: Frontend receives 401 mid-operation when token expires
   - Mitigation: Frontend should implement automatic token refresh (Epic 5)
   - UX: Graceful error handling, don't lose user's work

---

## Definition of Done

- [ ] All 5 stories completed with acceptance criteria met
- [ ] Database schema migrated successfully
- [ ] All 5 auth endpoints working and tested
- [ ] JWT utilities have >90% test coverage
- [ ] Integration tests cover success and error scenarios
- [ ] Password hashing uses bcrypt with cost factor 10
- [ ] JWTs signed with strong secrets from environment variables
- [ ] Swagger documentation generated for all auth endpoints
- [ ] Middleware protects routes correctly (returns 401 for invalid tokens)

---

## Testing Strategy

### Unit Tests
- Password hashing and comparison
- JWT signing and verification
- Session token hashing

### Integration Tests
- User registration (success, duplicate email, weak password, terms not accepted)
- User login (success, invalid email, invalid password)
- Token refresh (success, invalid token, expired token)
- Logout (success, invalid token)
- Protected route access (success with valid token, 401 without token)

### Manual Testing
- Use Postman/Insomnia to test all endpoints
- Verify tokens in jwt.io
- Check database for proper data storage

---

## Success Metrics

**Security:** No plaintext passwords in database, all tokens properly signed

**Performance:** Login/register response time <200ms

**Reliability:** >99% success rate for valid requests

---

## Notes for Developers

- **Use Bun's built-in utilities** where possible (Bun.password for bcrypt, Bun.hash for SHA-256)
- **Don't over-engineer session management** - Simple table with expiry is sufficient for MVP
- **Frontend will handle token storage** - Backend just issues tokens, doesn't manage cookies
- **Test with real passwords** - Include test cases for weak passwords that should be rejected

---

## Handoff to Next Epic

Once Epic 2 is complete, Epic 3 (Backend Notes CRUD) can begin. Developers will have:
- ✅ Working authentication system
- ✅ Protected route middleware
- ✅ User accounts in database
- ✅ JWT token generation and validation

Epic 3 will implement notes CRUD endpoints that require authentication.
