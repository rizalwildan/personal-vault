import { Elysia } from 'elysia';
import { db, sql } from '../db/client';

export const healthRoutes = new Elysia({ prefix: '/health' }).get(
  '/',
  async () => {
    try {
      await db.execute(sql`SELECT 1`);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
  {
    detail: {
      tags: ['health'],
      summary: 'Health check endpoint',
      description:
        'Returns service health status including database connectivity',
    },
  },
);
