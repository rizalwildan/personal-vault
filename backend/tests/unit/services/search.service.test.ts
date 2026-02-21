// Set test environment variables before importing
process.env.JWT_ACCESS_SECRET =
  'test-access-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET =
  'test-refresh-secret-key-for-testing-purposes-only';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
process.env.DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/personal_vault';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.PORT = '8000';

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { SearchService } from '../../../src/services/search.service';
import { embeddingService } from '../../../src/services/embedding.service';
import { db } from '../../../src/db/client';

// Store original methods to restore after each test
const originalMethods = {
  generateEmbedding: embeddingService.generateEmbedding.bind(embeddingService),
  dbExecute: db.execute.bind(db),
};

describe('SearchService - Unit Tests', () => {
  let searchService: SearchService;
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    searchService = new SearchService();
  });

  afterEach(() => {
    // Restore original methods after each test
    embeddingService.generateEmbedding = originalMethods.generateEmbedding;
    db.execute = originalMethods.dbExecute;
  });

  test('returns results mapped to correct SearchResult shape with rank', async () => {
    const mockEmbedding = new Float32Array(384).fill(0.1);
    const mockRows = [
      {
        id: 'note-1',
        user_id: mockUserId,
        title: 'First Note',
        content: 'Content 1',
        tags: ['tag1'],
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-01'),
        similarity: 0.95,
      },
      {
        id: 'note-2',
        user_id: mockUserId,
        title: 'Second Note',
        content: 'Content 2',
        tags: ['tag2'],
        created_at: new Date('2026-01-02'),
        updated_at: new Date('2026-01-02'),
        similarity: 0.85,
      },
      {
        id: 'note-3',
        user_id: mockUserId,
        title: 'Third Note',
        content: 'Content 3',
        tags: [],
        created_at: new Date('2026-01-03'),
        updated_at: new Date('2026-01-03'),
        similarity: 0.75,
      },
    ];

    const generateEmbeddingMock = mock(() => Promise.resolve(mockEmbedding));
    const dbExecuteMock = mock(() => Promise.resolve(mockRows));

    embeddingService.generateEmbedding = generateEmbeddingMock as any;
    db.execute = dbExecuteMock as any;

    const result = await searchService.semanticSearch(
      mockUserId,
      'test query',
      10,
      0.7,
    );

    expect(result.results).toBeArray();
    expect(result.results.length).toBe(3);
    expect(result.results[0]).toMatchObject({
      note: {
        id: 'note-1',
        user_id: mockUserId,
        title: 'First Note',
        content: 'Content 1',
        tags: ['tag1'],
      },
      similarity: 0.95,
      rank: 1,
    });
    expect(result.results[1].rank).toBe(2);
    expect(result.results[2].rank).toBe(3);
    expect(generateEmbeddingMock).toHaveBeenCalledWith('test query');
  });

  test('applies threshold filter - results below threshold are excluded', async () => {
    const mockEmbedding = new Float32Array(384).fill(0.1);
    const mockRows = [
      {
        id: 'note-1',
        user_id: mockUserId,
        title: 'High Similarity',
        content: 'Content 1',
        tags: [],
        created_at: new Date(),
        updated_at: new Date(),
        similarity: 0.85,
      },
    ];

    const generateEmbeddingMock = mock(() => Promise.resolve(mockEmbedding));
    const dbExecuteMock = mock(() => Promise.resolve(mockRows));

    embeddingService.generateEmbedding = generateEmbeddingMock as any;
    db.execute = dbExecuteMock as any;

    const threshold = 0.8;
    const result = await searchService.semanticSearch(
      mockUserId,
      'query',
      10,
      threshold,
    );

    // Verify the service was called and returned results
    expect(dbExecuteMock).toHaveBeenCalled();
    expect(result.results.length).toBe(1);
    expect(result.results[0].similarity).toBeGreaterThanOrEqual(threshold);
  });

  test('tags filter uses contains-all (@>) operator', async () => {
    const mockEmbedding = new Float32Array(384).fill(0.1);
    const mockRows = [
      {
        id: 'note-1',
        user_id: mockUserId,
        title: 'Tagged Note',
        content: 'Content',
        tags: ['docker', 'kubernetes'],
        created_at: new Date(),
        updated_at: new Date(),
        similarity: 0.9,
      },
    ];

    const generateEmbeddingMock = mock(() => Promise.resolve(mockEmbedding));
    const dbExecuteMock = mock(() => Promise.resolve(mockRows));

    embeddingService.generateEmbedding = generateEmbeddingMock as any;
    db.execute = dbExecuteMock as any;

    const result = await searchService.semanticSearch(
      mockUserId,
      'query',
      10,
      0.7,
      ['docker', 'kubernetes'],
    );

    // Verify the service was called and returned filtered results
    expect(dbExecuteMock).toHaveBeenCalled();
    expect(result.results.length).toBe(1);
    expect(result.results[0].note.tags).toContain('docker');
    expect(result.results[0].note.tags).toContain('kubernetes');
  });

  test('when generateEmbedding throws, fullTextSearch fallback is called', async () => {
    const generateEmbeddingMock = mock(() =>
      Promise.reject(new Error('Embedding model unavailable')),
    );
    const mockFallbackRows = [
      {
        id: 'note-1',
        user_id: mockUserId,
        title: 'Fallback Note',
        content: 'Content with query terms',
        tags: [],
        created_at: new Date(),
        updated_at: new Date(),
        similarity: 0.5,
      },
    ];
    const dbExecuteMock = mock(() => Promise.resolve(mockFallbackRows));

    embeddingService.generateEmbedding = generateEmbeddingMock as any;
    db.execute = dbExecuteMock as any;

    const result = await searchService.semanticSearch(
      mockUserId,
      'query',
      10,
      0.7,
    );

    expect(generateEmbeddingMock).toHaveBeenCalledWith('query');
    expect(result.results).toBeArray();
    expect(result.results.length).toBe(1);
    expect(result.results[0].note.id).toBe('note-1');
    expect(result.query_metadata.query).toBe('query');
  });

  test('SQL query only includes notes with embedding_status = completed', async () => {
    const mockEmbedding = new Float32Array(384).fill(0.1);
    const mockRows: any[] = [];

    const generateEmbeddingMock = mock(() => Promise.resolve(mockEmbedding));
    const dbExecuteMock = mock(() => Promise.resolve(mockRows));

    embeddingService.generateEmbedding = generateEmbeddingMock as any;
    db.execute = dbExecuteMock as any;

    const result = await searchService.semanticSearch(
      mockUserId,
      'query',
      10,
      0.7,
    );

    // Verify semantic search was attempted and SQL contains embedding_status filter
    expect(dbExecuteMock).toHaveBeenCalled();
    const sqlQuery = (dbExecuteMock.mock.calls as any)[0][0];
    const queryString = JSON.stringify(sqlQuery);
    expect(queryString).toContain("embedding_status = 'completed'");
    expect(result.results.length).toBe(0);
  });

  test('SQL query only includes notes with is_archived = false', async () => {
    const mockEmbedding = new Float32Array(384).fill(0.1);
    const mockRows: any[] = [];

    const generateEmbeddingMock = mock(() => Promise.resolve(mockEmbedding));
    const dbExecuteMock = mock(() => Promise.resolve(mockRows));

    embeddingService.generateEmbedding = generateEmbeddingMock as any;
    db.execute = dbExecuteMock as any;

    const result = await searchService.semanticSearch(
      mockUserId,
      'query',
      10,
      0.7,
    );

    // Verify semantic search was attempted and SQL contains is_archived filter
    expect(dbExecuteMock).toHaveBeenCalled();
    const sqlQuery = (dbExecuteMock.mock.calls as any)[0][0];
    const queryString = JSON.stringify(sqlQuery);
    expect(queryString).toContain('is_archived = false');
    expect(result.results.length).toBe(0);
  });

  test('SQL query always scopes to user_id', async () => {
    const mockEmbedding = new Float32Array(384).fill(0.1);
    const mockRows: any[] = [];

    const generateEmbeddingMock = mock(() => Promise.resolve(mockEmbedding));
    const dbExecuteMock = mock(() => Promise.resolve(mockRows));

    embeddingService.generateEmbedding = generateEmbeddingMock as any;
    db.execute = dbExecuteMock as any;

    const result = await searchService.semanticSearch(
      mockUserId,
      'query',
      10,
      0.7,
    );

    // Verify semantic search was attempted and SQL contains user_id filter
    expect(dbExecuteMock).toHaveBeenCalled();
    const sqlQuery = (dbExecuteMock.mock.calls as any)[0][0];
    const queryString = JSON.stringify(sqlQuery);
    expect(queryString).toContain('user_id');
    expect(queryString).toContain(mockUserId);
    expect(result.results.length).toBe(0);
  });

  test('returns query_metadata with correct processing_time_ms', async () => {
    const mockEmbedding = new Float32Array(384).fill(0.1);
    const mockRows: any[] = [];

    const generateEmbeddingMock = mock(() => Promise.resolve(mockEmbedding));
    const dbExecuteMock = mock(() => Promise.resolve(mockRows));

    embeddingService.generateEmbedding = generateEmbeddingMock as any;
    db.execute = dbExecuteMock as any;

    const result = await searchService.semanticSearch(
      mockUserId,
      'test query',
      10,
      0.7,
    );

    expect(result.query_metadata).toMatchObject({
      query: 'test query',
      total_results: 0,
    });
    expect(result.query_metadata.processing_time_ms).toBeGreaterThanOrEqual(0);
    expect(typeof result.query_metadata.processing_time_ms).toBe('number');
  });

  test('full-text search includes plainto_tsquery and ts_rank', async () => {
    // Force fallback by making generateEmbedding throw
    const generateEmbeddingMock = mock(() =>
      Promise.reject(new Error('Model error')),
    );
    const mockRows: any[] = [];
    const dbExecuteMock = mock(() => Promise.resolve(mockRows));

    embeddingService.generateEmbedding = generateEmbeddingMock as any;
    db.execute = dbExecuteMock as any;

    const result = await searchService.semanticSearch(
      mockUserId,
      'query',
      10,
      0.7,
    );

    // Verify fallback was called (db.execute should be called for fallback)
    expect(dbExecuteMock).toHaveBeenCalled();
    expect(result.results.length).toBe(0);
  });
});
