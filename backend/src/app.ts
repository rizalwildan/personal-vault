import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { notesRoutes } from './routes/notes.routes';
import { tagsRoutes } from './routes/tags.routes';
import { searchRoutes } from './routes/search.routes';
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
          { name: 'notes', description: 'Note management endpoints' },
          { name: 'tags', description: 'Tag management endpoints' },
          { name: 'search', description: 'Semantic search endpoints' },
        ],
      },
    }),
  )
  .use(healthRoutes)
  .use(authRoutes)
  .use(notesRoutes)
  .use(tagsRoutes)
  .use(searchRoutes)
  .get('/', () => ({
    message: 'BMad Personal Vault API',
    version: '1.0.0',
    docs: '/swagger',
  }));
