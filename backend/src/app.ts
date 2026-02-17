import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { env } from './config/env';

export const app = new Elysia()
  .use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Personal Vault API',
          version: '1.0.0',
          description:
            'REST API for Personal Vault knowledge management system',
        },
        tags: [
          { name: 'health', description: 'Health check endpoints' },
          { name: 'auth', description: 'Authentication endpoints' },
        ],
      },
    }),
  )
  .use(healthRoutes)
  .use(authRoutes)
  .get('/', () => ({
    message: 'BMad Personal Vault API',
    version: '1.0.0',
    docs: '/swagger',
  }));
