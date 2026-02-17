import { verifyAccessToken } from '../utils/auth';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const authMiddleware = async (ctx: any) => {
  const authHeader =
    ctx.request?.headers.get('authorization') || ctx.headers?.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.set.status = 401;
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid authentication required',
      },
    };
  }

  const token = authHeader.substring(7);

  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch (error) {
    ctx.set.status = 401;
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    };
  }

  // Fetch user from database
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
  });

  if (!user) {
    ctx.set.status = 401;
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not found',
      },
    };
  }

  // Attach user to context
  ctx.currentUser = user;
};
