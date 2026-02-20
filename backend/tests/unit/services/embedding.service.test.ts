import { describe, test, expect, beforeAll } from 'bun:test';
import { embeddingService } from '../../../src/services/embedding.service';

describe('EmbeddingService', () => {
  // Initialize once before all tests (model download takes time)
  beforeAll(async () => {
    await embeddingService.initialize();
  }, 120000); // 2 minute timeout for model download/initialization

  test('should initialize model on first use', async () => {
    const status = embeddingService.getStatus();
    expect(status.isInitialized).toBe(true);
  });

  test('should generate 384-dimensional Float32Array', async () => {
    const embedding = await embeddingService.generateEmbedding('test text');
    expect(embedding).toBeInstanceOf(Float32Array);
    expect(embedding.length).toBe(384);
  });

  test('should generate embedding within timeout', async () => {
    const start = Date.now();
    await embeddingService.generateEmbedding('test text');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // Generous timeout for CI
  });

  test('should throw error if not initialized', async () => {
    // Create a new instance for this test
    const { EmbeddingService } =
      await import('../../../src/services/embedding.service');
    const newService = new EmbeddingService();
    await expect(newService.generateEmbedding('test')).rejects.toThrow(
      'Embedding service not initialized',
    );
  });

  test('should produce different embeddings for different text', async () => {
    const emb1 = await embeddingService.generateEmbedding('hello world');
    const emb2 = await embeddingService.generateEmbedding('goodbye world');
    expect(emb1).not.toEqual(emb2);
  });

  test('should generate consistent embedding for same text', async () => {
    const emb1 = await embeddingService.generateEmbedding('consistent text');
    const emb2 = await embeddingService.generateEmbedding('consistent text');
    expect(emb1).toEqual(emb2);
  });
});
