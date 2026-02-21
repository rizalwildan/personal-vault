import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { testClient } from '../../test-utils';
import { db } from '../../../src/db/client';
import { users, sessions, notes } from '../../../src/db/schema';
import { hashPassword, signAccessToken } from '../../../src/utils/auth';
import { embeddingQueue } from '../../../src/queues/embedding.queue';

describe('POST /api/v1/notes', () => {
  let testUser: any;
  let accessToken: string;

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

  it('should create note successfully with required fields', async () => {
    const response = await testClient.post('/api/v1/notes').json(
      {
        title: 'Test Note',
        content: 'This is test content',
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.note).toBeDefined();
    expect(data.data.note.id).toBeDefined();
    expect(data.data.note.user_id).toBe(testUser.id);
    expect(data.data.note.title).toBe('Test Note');
    expect(data.data.note.content).toBe('This is test content');
    expect(data.data.note.embedding_status).toBe('pending');
    expect(data.data.note.tags).toEqual([]);
    expect(data.data.note.is_archived).toBe(false);
    expect(data.data.note.created_at).toBeDefined();
    expect(data.data.note.updated_at).toBeDefined();
  });

  it('should create note with tags', async () => {
    const response = await testClient.post('/api/v1/notes').json(
      {
        title: 'Docker Note',
        content: 'Docker best practices',
        tags: ['docker', 'devops'],
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.note.tags).toEqual(['docker', 'devops']);

    // Verify in database
    const dbNote = await db.query.notes.findFirst({
      where: (notes, { eq }) => eq(notes.id, data.data.note.id),
    });
    expect(dbNote?.tags).toEqual(['docker', 'devops']);
  });

  it('should trigger embedding queue for new note', async () => {
    // Spy on embeddingQueue.enqueue to verify it's called
    const enqueueSpy = spyOn(embeddingQueue, 'enqueue').mockResolvedValue(
      undefined,
    );

    const response = await testClient.post('/api/v1/notes').json(
      {
        title: 'Queue Test Note',
        content: 'This should trigger embedding',
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(201);
    const data = await response.json();

    // Note should be created with pending status
    expect(data.data.note.embedding_status).toBe('pending');

    // Verify embeddingQueue.enqueue was called with the note's ID
    expect(enqueueSpy).toHaveBeenCalledTimes(1);
    expect(enqueueSpy).toHaveBeenCalledWith(data.data.note.id);

    // Clean up the spy
    enqueueSpy.mockRestore();

    // Verify note exists in database
    const dbNote = await db.query.notes.findFirst({
      where: (notes, { eq }) => eq(notes.id, data.data.note.id),
    });
    expect(dbNote).toBeDefined();
    expect(dbNote?.embedding_status).toBe('pending');
  });

  it('should reject request when title is missing', async () => {
    const response = await testClient.post('/api/v1/notes').json(
      {
        content: 'Content without title',
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(422);
  });

  it('should reject request when content is empty', async () => {
    const response = await testClient.post('/api/v1/notes').json(
      {
        title: 'Test Note',
        content: '',
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(422);
  });

  it('should reject request when title is too long', async () => {
    const longTitle = 'a'.repeat(201); // Exceeds 200 char limit
    const response = await testClient.post('/api/v1/notes').json(
      {
        title: longTitle,
        content: 'Test content',
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(422);
  });

  it('should require authentication', async () => {
    const response = await testClient.post('/api/v1/notes').json({
      title: 'Test Note',
      content: 'Test content',
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject invalid JWT token', async () => {
    const response = await testClient.post('/api/v1/notes').json(
      {
        title: 'Test Note',
        content: 'Test content',
      },
      {
        authorization: 'Bearer invalid-token',
      },
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should create multiple notes for same user', async () => {
    // Create first note
    const response1 = await testClient.post('/api/v1/notes').json(
      {
        title: 'First Note',
        content: 'First content',
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response1.status).toBe(201);

    // Create second note
    const response2 = await testClient.post('/api/v1/notes').json(
      {
        title: 'Second Note',
        content: 'Second content',
      },
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response2.status).toBe(201);

    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(data1.data.note.id).not.toBe(data2.data.note.id);
  });
});
