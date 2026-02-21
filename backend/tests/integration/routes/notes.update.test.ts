import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { testClient } from '../../test-utils';
import { db } from '../../../src/db/client';
import { users, sessions, notes } from '../../../src/db/schema';
import { hashPassword, signAccessToken } from '../../../src/utils/auth';
import { embeddingQueue } from '../../../src/queues/embedding.queue';
import { eq } from 'drizzle-orm';

describe('PATCH /api/v1/notes/:id', () => {
  let testUser: { id: string; email: string };
  let accessToken: string;
  let testNote: { id: string; title: string; content: string };

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

    // Generate access token
    accessToken = await signAccessToken(testUser.id);

    // Create test note
    const [note] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'Test Note',
        content: 'Test content',
        tags: ['tag1'],
        is_archived: false,
        embedding_status: 'completed',
      })
      .returning();

    testNote = note;
  });

  it('should update title only and preserve embedding_status', async () => {
    const response = await testClient
      .patch(`/api/v1/notes/${testNote.id}`)
      .json({ title: 'New Title' }, { authorization: `Bearer ${accessToken}` });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('New Title');
    expect(body.data.content).toBe('Test content');

    // Verify embedding_status unchanged
    const [updatedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, testNote.id));
    expect(updatedNote.embedding_status).toBe('completed');
  });

  it('should update content and trigger re-indexing', async () => {
    // Spy on embeddingQueue.enqueue
    const enqueueSpy = spyOn(embeddingQueue, 'enqueue');

    const response = await testClient
      .patch(`/api/v1/notes/${testNote.id}`)
      .json(
        { content: 'New content' },
        { authorization: `Bearer ${accessToken}` },
      );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.content).toBe('New content');
    expect(body.data.embedding_status).toBe('pending');

    // Verify embedding was queued
    expect(enqueueSpy).toHaveBeenCalledTimes(1);
    expect(enqueueSpy).toHaveBeenCalledWith(testNote.id);
  });

  it('should update tags only and preserve embedding_status', async () => {
    const response = await testClient
      .patch(`/api/v1/notes/${testNote.id}`)
      .json(
        { tags: ['newtag', 'anothertag'] },
        { authorization: `Bearer ${accessToken}` },
      );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.tags).toEqual(['newtag', 'anothertag']);

    // Verify embedding_status unchanged
    const [updatedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, testNote.id));
    expect(updatedNote.embedding_status).toBe('completed');
  });

  it('should update is_archived (soft delete via PATCH)', async () => {
    const response = await testClient
      .patch(`/api/v1/notes/${testNote.id}`)
      .json(
        { is_archived: true },
        { authorization: `Bearer ${accessToken}` },
      );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.is_archived).toBe(true);

    // Verify embedding_status unchanged
    const [updatedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, testNote.id));
    expect(updatedNote.embedding_status).toBe('completed');
  });

  it('should update multiple fields (title + tags, no content)', async () => {
    const response = await testClient
      .patch(`/api/v1/notes/${testNote.id}`)
      .json(
        { title: 'New Title', tags: ['tag1', 'tag2'] },
        { authorization: `Bearer ${accessToken}` },
      );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('New Title');
    expect(body.data.tags).toEqual(['tag1', 'tag2']);

    // Verify embedding_status unchanged
    const [updatedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, testNote.id));
    expect(updatedNote.embedding_status).toBe('completed');
  });

  it('should accept empty update (no fields)', async () => {
    const response = await testClient
      .patch(`/api/v1/notes/${testNote.id}`)
      .json({}, { authorization: `Bearer ${accessToken}` });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Test Note');
    expect(body.data.content).toBe('Test content');
  });

  it('should return 400 for validation error (title too long)', async () => {
    const longTitle = 'a'.repeat(201);

    const response = await testClient
      .patch(`/api/v1/notes/${testNote.id}`)
      .json(
        { title: longTitle },
        { authorization: `Bearer ${accessToken}` },
      );

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('should return 404 when note does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await testClient
      .patch(`/api/v1/notes/${nonExistentId}`)
      .json(
        { title: 'New Title' },
        { authorization: `Bearer ${accessToken}` },
      );

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should return 404 when user tries to update other user note', async () => {
    // Create another user
    const passwordHash = await hashPassword('TestPassword456');
    const [otherUser] = await db
      .insert(users)
      .values({
        email: 'other@example.com',
        password_hash: passwordHash,
        name: 'Other User',
        terms_accepted_at: new Date(),
      })
      .returning();

    // Create note for other user
    const [otherNote] = await db
      .insert(notes)
      .values({
        user_id: otherUser.id,
        title: 'Other User Note',
        content: 'Other user content',
        tags: [],
        is_archived: false,
        embedding_status: 'pending',
      })
      .returning();

    // Try to update other user's note with testUser token
    const response = await testClient
      .patch(`/api/v1/notes/${otherNote.id}`)
      .json(
        { title: 'Hacked Title' },
        { authorization: `Bearer ${accessToken}` },
      );

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  // Edge cases
  it('should handle update with no changes (same content)', async () => {
    // Spy on embeddingQueue.enqueue
    const enqueueSpy = spyOn(embeddingQueue, 'enqueue');

    const response = await testClient
      .patch(`/api/v1/notes/${testNote.id}`)
      .json(
        { content: 'Test content' }, // Same content
        { authorization: `Bearer ${accessToken}` },
      );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);

    // Verify embedding was NOT queued (content unchanged)
    expect(enqueueSpy).not.toHaveBeenCalled();

    // Verify embedding_status unchanged
    const [updatedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, testNote.id));
    expect(updatedNote.embedding_status).toBe('completed');
  });

  it('should handle special characters in title and content', async () => {
    const specialTitle = 'Test 😀 émoji & spëcial chärs';
    const specialContent =
      '# Markdown\n\n**Bold** _italic_ `code`\n\n> Quote\n\n```js\nconsole.log("test");\n```';

    const response = await testClient
      .patch(`/api/v1/notes/${testNote.id}`)
      .json(
        { title: specialTitle, content: specialContent },
        { authorization: `Bearer ${accessToken}` },
      );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe(specialTitle);
    expect(body.data.content).toBe(specialContent);

    // Verify stored correctly
    const [updatedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, testNote.id));
    expect(updatedNote.title).toBe(specialTitle);
    expect(updatedNote.content).toBe(specialContent);
  });

  it('should detect content change with whitespace differences', async () => {
    // Spy on embeddingQueue.enqueue
    const enqueueSpy = spyOn(embeddingQueue, 'enqueue');

    // Change content with subtle whitespace difference
    const response = await testClient
      .patch(`/api/v1/notes/${testNote.id}`)
      .json(
        { content: 'Test content ' }, // Added trailing space
        { authorization: `Bearer ${accessToken}` },
      );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);

    // Verify embedding WAS queued (content changed, even if just whitespace)
    expect(enqueueSpy).toHaveBeenCalledTimes(1);
  });
});
