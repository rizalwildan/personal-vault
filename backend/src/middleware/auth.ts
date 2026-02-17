import { verifyAccessToken } from '../utils/auth';

export const authMiddleware = async (ctx: any) => {
  const authHeader =
    ctx.request?.headers.get('authorization') || ctx.headers?.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyAccessToken(token);
    return { userId: payload.userId };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 401 };
  }
};
