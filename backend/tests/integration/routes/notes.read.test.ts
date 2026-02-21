import { describe, it, expect, beforeEach } from 'bun:test';
import { testClient } from '../../test-utils';
import { db } from '../../../src/db/client';
import { users, sessions, notes } from '../../../src/db/schema';
import { hashPassword, signAccessToken } from '../../../src/utils/auth';

describe('GET /api/v1/notes/:id', () => {
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
        tags: ['tag1', 'tag2'],
        is_archived: false,
        embedding_status: 'pending',
      })
      .returning();

    testNote = note;
  });

  it('should get note successfully', async () => {
    const response = await testClient
      .get(`/api/v1/notes/${testNote.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.id).toBe(testNote.id);
    expect(body.data.title).toBe('Test Note');
    expect(body.data.content).toBe('Test content');
    expect(body.data.tags).toEqual(['tag1', 'tag2']);
    expect(body.data.user_id).toBe(testUser.id);
  });

  it('should return 404 when note does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await testClient
      .get(`/api/v1/notes/${nonExistentId}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should return 404 when user tries to access other user note', async () => {
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

    // Try to access other user's note with testUser token
    const response = await testClient
      .get(`/api/v1/notes/${otherNote.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 when authentication is missing', async () => {
    const response = await testClient
      .get(`/api/v1/notes/${testNote.id}`)
      .json();

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
