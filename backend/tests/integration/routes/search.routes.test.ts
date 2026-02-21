import { describe, it, expect, beforeEach, beforeAll, spyOn } from 'bun:test';
import { testClient } from '../../test-utils';
import { db, sql } from '../../../src/db/client';
import { users, sessions, notes } from '../../../src/db/schema';
import { hashPassword, signAccessToken } from '../../../src/utils/auth';
import { embeddingService } from '../../../src/services/embedding.service';

describe('POST /api/v1/search', () => {
  let testUser: any;
  let accessToken: string;

  // Initialize embedding service once before all tests
  beforeAll(async () => {
    await embeddingService.initialize();
  }, 120000); // 2 minute timeout for model initialization

  beforeEach(async () => {
    // Clean database
    await db.delete(notes);
    await db.delete(sessions);
    await db.delete(users);

    // Create test user
    const passwordHash = await hashPassword('TestPassword123');
    const [user] = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        password_hash: passwordHash,
        name: 'Test User',
        terms_accepted_at: new Date(),
      })
      .returning();

    testUser = user;
    accessToken = await signAccessToken(user.id);
  });

  it('should return 401 when no Authorization header provided', async () => {
    const response = await testClient.post('/api/v1/search').json({
      query: 'test query',
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 400 when query is empty string', async () => {
    const response = await testClient.post('/api/v1/search').json(
      {
        query: '',
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(422); // Elysia returns 422 for schema validation
  });

  it('should return 400 when query is omitted', async () => {
    const response = await testClient.post('/api/v1/search').json(
      {},
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(422);
  });

  it('should return 400 when query exceeds 500 chars', async () => {
    const longQuery = 'a'.repeat(501);
    const response = await testClient.post('/api/v1/search').json(
      {
        query: longQuery,
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(422);
  });

  it('should return 400 when limit exceeds 50', async () => {
    const response = await testClient.post('/api/v1/search').json(
      {
        query: 'test query',
        limit: 51,
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(422);
  });

  it('should return 400 when query is only whitespace', async () => {
    const response = await testClient.post('/api/v1/search').json(
      {
        query: '   ',
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_INPUT');
  });

  it('should return 200 with correct response shape', async () => {
    // Seed a test note with pre-computed embedding
    const [note] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'Docker Tutorial',
        content: 'Learn Docker containerization basics',
        tags: ['docker'],
        embedding_status: 'completed',
      })
      .returning();

    // Generate and set embedding for the note
    const embedding = await embeddingService.generateEmbedding(note.content);
    const vectorString = `[${Array.from(embedding).join(',')}]`;
    await db.execute(sql`
      UPDATE notes
      SET embedding = ${vectorString}::vector
      WHERE id = ${note.id}
    `);

    // Perform search
    const response = await testClient.post('/api/v1/search').json(
      {
        query: 'docker containers',
        limit: 10,
        threshold: 0.5,
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.results).toBeArray();
    expect(data.data.query_metadata).toBeDefined();

    // Verify query_metadata shape
    expect(data.data.query_metadata.query).toBe('docker containers');
    expect(typeof data.data.query_metadata.processing_time_ms).toBe('number');
    expect(typeof data.data.query_metadata.total_results).toBe('number');

    // If results exist, verify result shape
    if (data.data.results.length > 0) {
      const firstResult = data.data.results[0];
      expect(firstResult.note).toBeDefined();
      expect(firstResult.note.id).toBeDefined();
      expect(firstResult.note.user_id).toBe(testUser.id);
      expect(firstResult.note.title).toBeDefined();
      expect(firstResult.note.content).toBeDefined();
      expect(firstResult.note.tags).toBeArray();
      expect(firstResult.note.created_at).toBeDefined();
      expect(firstResult.note.updated_at).toBeDefined();
      expect(typeof firstResult.similarity).toBe('number');
      expect(firstResult.similarity).toBeGreaterThanOrEqual(0);
      expect(firstResult.similarity).toBeLessThanOrEqual(1);
      expect(typeof firstResult.rank).toBe('number');
      expect(firstResult.rank).toBeGreaterThanOrEqual(1);
    }
  });

  it('should return results ordered by similarity descending', async () => {
    // Seed two notes with different embeddings
    // Note 1: highly relevant to "docker"
    const [note1] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'Docker Guide',
        content: 'Docker is a containerization platform for applications',
        tags: [],
        embedding_status: 'completed',
      })
      .returning();

    const embedding1 = await embeddingService.generateEmbedding(note1.content);
    const vectorString1 = `[${Array.from(embedding1).join(',')}]`;
    await db.execute(sql`
      UPDATE notes
      SET embedding = ${vectorString1}::vector
      WHERE id = ${note1.id}
    `);

    // Note 2: less relevant to "docker"
    const [note2] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'JavaScript Basics',
        content: 'JavaScript is a programming language for web development',
        tags: [],
        embedding_status: 'completed',
      })
      .returning();

    const embedding2 = await embeddingService.generateEmbedding(note2.content);
    const vectorString2 = `[${Array.from(embedding2).join(',')}]`;
    await db.execute(sql`
      UPDATE notes
      SET embedding = ${vectorString2}::vector
      WHERE id = ${note2.id}
    `);

    // Search for "docker"
    const response = await testClient.post('/api/v1/search').json(
      {
        query: 'docker containerization',
        limit: 10,
        threshold: 0.1, // Low threshold to include both
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.results.length).toBeGreaterThanOrEqual(1);

    // Verify ordering - each result should have similarity >= next result
    for (let i = 0; i < data.data.results.length - 1; i++) {
      expect(data.data.results[i].similarity).toBeGreaterThanOrEqual(
        data.data.results[i + 1].similarity,
      );
    }

    // Verify rank is sequential 1, 2, 3...
    data.data.results.forEach((result: any, index: number) => {
      expect(result.rank).toBe(index + 1);
    });
  });

  it('should filter results by tags (contains-all)', async () => {
    // Seed note with matching tags
    const [note1] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'Docker and Kubernetes',
        content: 'Using Docker with Kubernetes orchestration',
        tags: ['docker', 'kubernetes', 'devops'],
        embedding_status: 'completed',
      })
      .returning();

    const embedding1 = await embeddingService.generateEmbedding(note1.content);
    const vectorString1 = `[${Array.from(embedding1).join(',')}]`;
    await db.execute(sql`
      UPDATE notes
      SET embedding = ${vectorString1}::vector
      WHERE id = ${note1.id}
    `);

    // Seed note without all matching tags
    const [note2] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'Docker Basics',
        content: 'Introduction to Docker containers',
        tags: ['docker'], // Missing 'kubernetes'
        embedding_status: 'completed',
      })
      .returning();

    const embedding2 = await embeddingService.generateEmbedding(note2.content);
    const vectorString2 = `[${Array.from(embedding2).join(',')}]`;
    await db.execute(sql`
      UPDATE notes
      SET embedding = ${vectorString2}::vector
      WHERE id = ${note2.id}
    `);

    // Search with tags filter requiring both 'docker' AND 'kubernetes'
    const response = await testClient.post('/api/v1/search').json(
      {
        query: 'containers',
        limit: 10,
        threshold: 0.1,
        tags: ['docker', 'kubernetes'],
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    // Should only return note1 which has both tags
    expect(data.data.results.length).toBe(1);
    expect(data.data.results[0].note.id).toBe(note1.id);
    expect(data.data.results[0].note.tags).toContain('docker');
    expect(data.data.results[0].note.tags).toContain('kubernetes');
  });

  it('should use full-text fallback for notes with pending embedding_status', async () => {
    // Seed note that will match via full-text search
    await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'Python Tutorial',
        content: 'Learn Python programming language basics',
        tags: ['python'],
        embedding_status: 'pending', // No embedding vector
      })
      .returning();

    // Mock generateEmbedding to throw, forcing fallback to full-text search
    const generateEmbeddingSpy = spyOn(
      embeddingService,
      'generateEmbedding',
    ).mockImplementation(() => {
      throw new Error('Embedding model unavailable');
    });

    try {
      // Search for the content (should fall back to full-text)
      const response = await testClient.post('/api/v1/search').json(
        {
          query: 'python programming',
          limit: 10,
          threshold: 0.5,
        },
        {
          authorization: `Bearer ${accessToken}`,
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      // fullTextSearch fallback should return the note
      expect(data.success).toBe(true);
      expect(data.data.results).toBeArray();
      expect(data.data.results.length).toBeGreaterThan(0);
      expect(data.data.results[0].note.title).toBe('Python Tutorial');
      expect(data.data.query_metadata).toBeDefined();
      expect(generateEmbeddingSpy).toHaveBeenCalledTimes(1);
    } finally {
      // Restore original implementation
      generateEmbeddingSpy.mockRestore();
    }
  });

  it('should complete search within 2 seconds (AC10 timing)', async () => {
    // Seed a test note
    const [note] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'Performance Test',
        content: 'This is a test for search performance requirements',
        tags: [],
        embedding_status: 'completed',
      })
      .returning();

    const embedding = await embeddingService.generateEmbedding(note.content);
    const vectorString = `[${Array.from(embedding).join(',')}]`;
    await db.execute(sql`
      UPDATE notes
      SET embedding = ${vectorString}::vector
      WHERE id = ${note.id}
    `);

    // Perform search
    const response = await testClient.post('/api/v1/search').json(
      {
        query: 'performance test',
        limit: 10,
        threshold: 0.5,
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    // Verify processing time is under 2 seconds
    expect(data.data.query_metadata.processing_time_ms).toBeLessThan(2000);
  });

  it('should only return notes owned by authenticated user', async () => {
    // Create second user
    const passwordHash = await hashPassword('TestPassword123');
    const [user2] = await db
      .insert(users)
      .values({
        email: 'user2@example.com',
        password_hash: passwordHash,
        name: 'User 2',
        terms_accepted_at: new Date(),
      })
      .returning();

    // Seed note for user2
    const [note2] = await db
      .insert(notes)
      .values({
        user_id: user2.id,
        title: 'User 2 Note',
        content: 'This belongs to user 2',
        tags: [],
        embedding_status: 'completed',
      })
      .returning();

    const embedding2 = await embeddingService.generateEmbedding(note2.content);
    const vectorString2 = `[${Array.from(embedding2).join(',')}]`;
    await db.execute(sql`
      UPDATE notes
      SET embedding = ${vectorString2}::vector
      WHERE id = ${note2.id}
    `);

    // Seed note for testUser
    const [note1] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'User 1 Note',
        content: 'This belongs to test user',
        tags: [],
        embedding_status: 'completed',
      })
      .returning();

    const embedding1 = await embeddingService.generateEmbedding(note1.content);
    const vectorString1 = `[${Array.from(embedding1).join(',')}]`;
    await db.execute(sql`
      UPDATE notes
      SET embedding = ${vectorString1}::vector
      WHERE id = ${note1.id}
    `);

    // Search as testUser
    const response = await testClient.post('/api/v1/search').json(
      {
        query: 'note',
        limit: 10,
        threshold: 0.1,
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    // All results should belong to testUser
    data.data.results.forEach((result: any) => {
      expect(result.note.user_id).toBe(testUser.id);
      expect(result.note.user_id).not.toBe(user2.id);
    });
  });

  it('should not return archived notes', async () => {
    // Seed archived note
    const [archivedNote] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'Archived Note',
        content: 'This note is archived',
        tags: [],
        embedding_status: 'completed',
        is_archived: true,
      })
      .returning();

    const embeddingArchived = await embeddingService.generateEmbedding(
      archivedNote.content,
    );
    const vectorStringArchived = `[${Array.from(embeddingArchived).join(',')}]`;
    await db.execute(sql`
      UPDATE notes
      SET embedding = ${vectorStringArchived}::vector
      WHERE id = ${archivedNote.id}
    `);

    // Seed active note
    const [activeNote] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'Active Note',
        content: 'This note is active',
        tags: [],
        embedding_status: 'completed',
        is_archived: false,
      })
      .returning();

    const embeddingActive = await embeddingService.generateEmbedding(
      activeNote.content,
    );
    const vectorStringActive = `[${Array.from(embeddingActive).join(',')}]`;
    await db.execute(sql`
      UPDATE notes
      SET embedding = ${vectorStringActive}::vector
      WHERE id = ${activeNote.id}
    `);

    // Search
    const response = await testClient.post('/api/v1/search').json(
      {
        query: 'note',
        limit: 10,
        threshold: 0.1,
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    // Should only return active note
    const resultIds = data.data.results.map((r: any) => r.note.id);
    expect(resultIds).not.toContain(archivedNote.id);
    if (data.data.results.length > 0) {
      expect(data.data.results[0].note.is_archived).toBeUndefined(); // Not in response schema
    }
  });
});
