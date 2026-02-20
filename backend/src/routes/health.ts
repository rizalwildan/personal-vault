import { Elysia } from 'elysia';
import { db, sql } from '../db/client';
import { embeddingService } from '../services/embedding.service';
import { embeddingQueue } from '../queues/embedding.queue';

export const healthRoutes = new Elysia({ prefix: '/health' }).get(
  '/',
  async () => {
    try {
      await db.execute(sql`SELECT 1`);

      const embeddingStatus = embeddingService.getStatus();
      const queueStatus = embeddingQueue.getStatus();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        embedding: {
          isInitialized: embeddingStatus.isInitialized,
          model: embeddingStatus.model,
          dimensions: embeddingStatus.dimensions,
          queueSize: queueStatus.queueSize,
        },
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
        'Returns service health status including database connectivity and embedding service status',
    },
  },
);
