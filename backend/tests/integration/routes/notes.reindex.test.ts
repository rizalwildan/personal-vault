import { describe, it, expect, beforeEach } from 'bun:test';
import { testClient } from '../../test-utils';
import { db } from '../../../src/db/client';
import { users, sessions, notes } from '../../../src/db/schema';
import { hashPassword, signAccessToken } from '../../../src/utils/auth';
import { eq, sql } from 'drizzle-orm';

describe('Notes Re-indexing Integration Tests', () => {
  let testUser: any;
  let accessToken: string;

  beforeEach(async () => {
    // Clean database with CASCADE
    await db.execute(sql`TRUNCATE TABLE ${notes} CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${sessions} CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${users} CASCADE`);

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

  it('re-index queues all notes', async () => {
    // Create notes with various statuses
    await db.insert(notes).values([
      {
        user_id: testUser.id,
        title: 'Note 1',
        content: 'Content 1',
        tags: [],
        embedding_status: 'completed',
      },
      {
        user_id: testUser.id,
        title: 'Note 2',
        content: 'Content 2',
        tags: [],
        embedding_status: 'pending',
      },
      {
        user_id: testUser.id,
        title: 'Note 3',
        content: 'Content 3',
        tags: [],
        embedding_status: 'failed',
      },
      {
        user_id: testUser.id,
        title: 'Note 4',
        content: 'Content 4',
        tags: [],
        embedding_status: 'completed',
      },
      {
        user_id: testUser.id,
        title: 'Note 5',
        content: 'Content 5',
        tags: [],
        embedding_status: 'pending',
      },
    ]);

    const response = await testClient.post('/api/v1/notes/reindex').json(
      {},
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.message).toBe('Re-indexing started');
    expect(data.data.queued_count).toBe(5);

    // Verify all notes are now either pending or processing (queue starts processing asynchronously)
    const updatedNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.user_id, testUser.id));
    for (const note of updatedNotes) {
      expect(['pending', 'processing']).toContain(note.embedding_status);
    }
  });

  it('re-index only affects user notes', async () => {
    // Create another user
    const passwordHash2 = await hashPassword('TestPassword456');
    const [user2] = await db
      .insert(users)
      .values({
        email: 'test2@example.com',
        password_hash: passwordHash2,
        name: 'Test User 2',
        terms_accepted_at: new Date(),
      })
      .returning();

    // Create notes for both users
    await db.insert(notes).values([
      {
        user_id: testUser.id,
        title: 'User1 Note',
        content: 'Content',
        tags: [],
        embedding_status: 'completed',
      },
      {
        user_id: user2.id,
        title: 'User2 Note',
        content: 'Content',
        tags: [],
        embedding_status: 'completed',
      },
    ]);

    // Re-index as user 1
    const response = await testClient.post('/api/v1/notes/reindex').json(
      {},
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.queued_count).toBe(1); // Only user1's note

    // Verify user1's note is pending, user2's is still completed
    const user1Notes = await db
      .select()
      .from(notes)
      .where(eq(notes.user_id, testUser.id));
    const user2Notes = await db
      .select()
      .from(notes)
      .where(eq(notes.user_id, user2.id));

    expect(user1Notes[0].embedding_status).toBe('pending');
    expect(user2Notes[0].embedding_status).toBe('completed');
  });

  it('re-index with no notes', async () => {
    const response = await testClient.post('/api/v1/notes/reindex').json(
      {},
      {
        authorization: `Bearer ${accessToken}`,
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.queued_count).toBe(0);
  });

  it('requires authentication', async () => {
    const response = await testClient.post('/api/v1/notes/reindex').json({});

    expect(response.status).toBe(401);
  });
});
