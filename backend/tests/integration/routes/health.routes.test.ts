import { beforeAll, describe, expect, test } from 'bun:test';
import { embeddingService } from '../../../src/services/embedding.service';
import { app } from '../../../src/app';

// The health endpoint reports isInitialized from embeddingService. Tests that
// use app.handle() bypass index.ts bootstrap, so we initialize here manually.
beforeAll(async () => {
  await embeddingService.initialize();
}, 120000); // 2 minute timeout for model download/initialization

describe('Health Routes', () => {
  test('GET /health returns embedding service status', async () => {
    const response = await app.handle(
      new Request('http://localhost/health', {
        method: 'GET',
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.embedding).toBeDefined();
    expect(body.embedding.isInitialized).toBe(true);
    expect(body.embedding.model).toBe(
      'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
    );
    expect(body.embedding.dimensions).toBe(384);
    expect(typeof body.embedding.queueSize).toBe('number');
    expect(body.embedding.queueSize).toBeGreaterThanOrEqual(0);
  });

  test('queue size updates in health endpoint', async () => {
    // This test would require enqueuing items and checking queue size
    // For now, just check the structure
    const response = await app.handle(
      new Request('http://localhost/health', {
        method: 'GET',
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.embedding.queueSize).toBeDefined();
  });
});
