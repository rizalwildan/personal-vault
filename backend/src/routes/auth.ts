import { Elysia, t } from 'elysia';
import { db } from '../db/client';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, signAccessToken, signRefreshToken } from '../utils/auth';
import { createHash } from 'node:crypto';
import { RegisterSchema } from '../../../shared/schemas/user';

export const authRoutes = new Elysia({ prefix: '/api/v1/auth' }).post(
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
);
