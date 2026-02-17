import { Elysia, t } from 'elysia';
import { db } from '../db/client';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
} from '../utils/auth';
import { createHash } from 'node:crypto';
import { RegisterSchema, LoginSchema } from '../../../shared/schemas/user';
import { loginRateLimiter } from '../middleware/rate-limiter';

export const authRoutes = new Elysia({ prefix: '/api/v1/auth' })
  .post(
    '/register',
    async ({ body, set }) => {
      // Validate with RegisterSchema as per story requirements
      const validatedBody = RegisterSchema.parse(body);
      const { email, password, name } = validatedBody;

      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        set.status = 409;
        return {
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'An account with this email already exists',
          },
        };
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password_hash: passwordHash,
          name,
          terms_accepted_at: new Date(),
        })
        .returning();

      if (!newUser) {
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'USER_CREATION_FAILED',
            message: 'Failed to create user',
          },
        };
      }

      // Generate tokens
      const accessToken = await signAccessToken(newUser.id);
      const refreshToken = await signRefreshToken(newUser.id);

      // Store refresh token hash
      const refreshTokenHash = createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      await db.insert(sessions).values({
        user_id: newUser.id,
        token_hash: refreshTokenHash,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      // Return success response
      set.status = 201;
      return {
        success: true,
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            avatar_url: newUser.avatar_url,
            terms_accepted_at: newUser.terms_accepted_at,
            created_at: newUser.created_at,
            updated_at: newUser.updated_at,
          },
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({
          minLength: 8,
          pattern: String.raw`^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$`,
        }),
        name: t.String({ minLength: 1, maxLength: 100 }),
        terms_accepted: t.Literal(true),
      }),
      detail: {
        tags: ['auth'],
        summary: 'Register a new user',
        description: 'Creates a new user account with secure password hashing',
      },
    },
  )
  .post(
    '/login',
    async ({ body, set, request }) => {
      try {
        // Rate limiting check
        // Use IP address as identifier (in production, consider using email + IP)
        const clientIp =
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'unknown';

        if (loginRateLimiter.isRateLimited(clientIp)) {
          const info = loginRateLimiter.getInfo(clientIp);
          set.status = 429;
          return {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many login attempts. Please try again later.',
              retryAfter: Math.ceil(info.resetInMs / 1000), // seconds
            },
          };
        }

        // Validate request body
        const validatedBody = LoginSchema.parse(body);
        const { email, password } = validatedBody;

        // Find user by email
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          console.warn(`Login attempt for non-existent email: ${email}`);
          set.status = 401;
          return {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          };
        }

        // Verify password
        const isValidPassword = await comparePassword(
          password,
          user.password_hash,
        );
        if (!isValidPassword) {
          console.warn(`Invalid password attempt for user: ${user.id}`);
          set.status = 401;
          return {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          };
        }

        // Generate tokens
        const accessToken = await signAccessToken(user.id);
        const refreshToken = await signRefreshToken(user.id);

        // Store refresh token hash in sessions
        const refreshTokenHash = createHash('sha256')
          .update(refreshToken)
          .digest('hex');
        await db.insert(sessions).values({
          user_id: user.id,
          token_hash: refreshTokenHash,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        // Return success response
        set.status = 200;
        return {
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              avatar_url: user.avatar_url,
              terms_accepted_at: user.terms_accepted_at,
              created_at: user.created_at,
              updated_at: user.updated_at,
            },
            access_token: accessToken,
            refresh_token: refreshToken,
          },
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message:
              error instanceof Error ? error.message : 'Internal server error',
          },
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ['auth'],
        summary: 'Login a user',
        description:
          'Authenticates a user and returns access and refresh tokens',
      },
    },
  )
  .post(
    '/logout',
    async ({ body, set }) => {
      const { refresh_token } = body as { refresh_token: string };

      if (!refresh_token) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Refresh token is required',
          },
        };
      }

      // Compute hash of provided token
      const tokenHash = createHash('sha256')
        .update(refresh_token)
        .digest('hex');

      // Delete session with matching token hash
      const deletedSessions = await db
        .delete(sessions)
        .where(eq(sessions.token_hash, tokenHash))
        .returning();

      // Check if any session was deleted
      if (deletedSessions.length === 0) {
        console.warn(`Logout attempt with invalid token hash: ${tokenHash}`);
        set.status = 400;
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid refresh token',
          },
        };
      }

      console.log(
        `Successfully logged out session for user: ${deletedSessions[0]?.user_id || 'unknown'}`,
      );

      set.status = 200;
      return {
        success: true,
        message: 'Logged out successfully',
      };
    },
    {
      body: t.Object({
        refresh_token: t.String(),
      }),
      detail: {
        tags: ['auth'],
        summary: 'Logout a user',
        description: 'Revokes the session associated with the refresh token',
      },
    },
  );
