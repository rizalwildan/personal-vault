import { describe, it, expect, beforeEach } from 'bun:test';
import { testClient } from '../../test-utils';
import { db } from '../../../src/db/client';
import { users, sessions, notes } from '../../../src/db/schema';
import { hashPassword, signAccessToken } from '../../../src/utils/auth';
import { eq } from 'drizzle-orm';

describe('GET /api/v1/notes', () => {
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

  it('should list notes with default pagination', async () => {
    // Create 5 test notes
    for (let i = 1; i <= 5; i++) {
      await db.insert(notes).values({
        user_id: testUser.id,
        title: `Test Note ${i}`,
        content: `Content ${i}`,
        tags: [],
        is_archived: false,
        embedding_status: 'pending',
      });
    }

    const response = await testClient
      .get('/api/v1/notes')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.notes).toBeDefined();
    expect(data.data.notes.length).toBe(5);
    expect(data.data.pagination).toBeDefined();
    expect(data.data.pagination.page).toBe(1);
    expect(data.data.pagination.limit).toBe(20);
    expect(data.data.pagination.total).toBe(5);
    expect(data.data.pagination.total_pages).toBe(1);
  });

  it('should paginate results correctly', async () => {
    // Create 50 test notes
    for (let i = 1; i <= 50; i++) {
      await db.insert(notes).values({
        user_id: testUser.id,
        title: `Test Note ${i}`,
        content: `Content ${i}`,
        tags: [],
        is_archived: false,
        embedding_status: 'pending',
      });
    }

    // Get page 1
    const response1 = await testClient
      .get('/api/v1/notes?page=1&limit=20')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response1.status).toBe(200);
    const data1 = await response1.json();
    expect(data1.data.notes.length).toBe(20);
    expect(data1.data.pagination.page).toBe(1);
    expect(data1.data.pagination.total).toBe(50);
    expect(data1.data.pagination.total_pages).toBe(3);

    // Get page 2
    const response2 = await testClient
      .get('/api/v1/notes?page=2&limit=20')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    const data2 = await response2.json();
    expect(data2.data.notes.length).toBe(20);
    expect(data2.data.pagination.page).toBe(2);

    // Get page 3
    const response3 = await testClient
      .get('/api/v1/notes?page=3&limit=20')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    const data3 = await response3.json();
    expect(data3.data.notes.length).toBe(10);
    expect(data3.data.pagination.page).toBe(3);
  });

  it('should respect custom limit parameter', async () => {
    // Create 25 test notes
    for (let i = 1; i <= 25; i++) {
      await db.insert(notes).values({
        user_id: testUser.id,
        title: `Test Note ${i}`,
        content: `Content ${i}`,
        tags: [],
        is_archived: false,
        embedding_status: 'pending',
      });
    }

    const response = await testClient
      .get('/api/v1/notes?limit=10')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.notes.length).toBe(10);
    expect(data.data.pagination.limit).toBe(10);
    expect(data.data.pagination.total_pages).toBe(3);
  });

  it('should clamp limit to maximum 100', async () => {
    // Create 150 test notes
    const notesToInsert = [];
    for (let i = 1; i <= 150; i++) {
      notesToInsert.push({
        user_id: testUser.id,
        title: `Test Note ${i}`,
        content: `Content ${i}`,
        tags: [],
        is_archived: false,
        embedding_status: 'pending' as const,
      });
    }
    await db.insert(notes).values(notesToInsert);

    const response = await testClient
      .get('/api/v1/notes?limit=150')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.notes.length).toBe(100);
    expect(data.data.pagination.limit).toBe(100);
  });

  it('should filter by tags', async () => {
    // Create notes with different tags
    await db.insert(notes).values([
      {
        user_id: testUser.id,
        title: 'Docker Note',
        content: 'Docker content',
        tags: ['docker'],
        is_archived: false,
        embedding_status: 'pending',
      },
      {
        user_id: testUser.id,
        title: 'Kubernetes Note',
        content: 'K8s content',
        tags: ['kubernetes'],
        is_archived: false,
        embedding_status: 'pending',
      },
      {
        user_id: testUser.id,
        title: 'Docker DevOps Note',
        content: 'Docker and DevOps',
        tags: ['docker', 'devops'],
        is_archived: false,
        embedding_status: 'pending',
      },
    ]);

    const response = await testClient
      .get('/api/v1/notes?tags=docker')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.notes.length).toBe(2);

    // Verify all returned notes have docker tag
    for (const note of data.data.notes) {
      expect(note.tags).toContain('docker');
    }
  });

  it('should filter by is_archived status', async () => {
    // Create active and archived notes
    await db.insert(notes).values([
      {
        user_id: testUser.id,
        title: 'Active Note',
        content: 'Active content',
        tags: [],
        is_archived: false,
        embedding_status: 'pending',
      },
      {
        user_id: testUser.id,
        title: 'Archived Note',
        content: 'Archived content',
        tags: [],
        is_archived: true,
        embedding_status: 'pending',
      },
    ]);

    // Get active notes (default)
    const response1 = await testClient
      .get('/api/v1/notes')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    const data1 = await response1.json();
    expect(data1.data.notes.length).toBe(1);
    expect(data1.data.notes[0].is_archived).toBe(false);

    // Get archived notes
    const response2 = await testClient
      .get('/api/v1/notes?is_archived=true')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    const data2 = await response2.json();
    expect(data2.data.notes.length).toBe(1);
    expect(data2.data.notes[0].is_archived).toBe(true);
  });

  it('should sort by created_at descending (default)', async () => {
    // Create notes with delays to ensure different timestamps
    await db.insert(notes).values({
      user_id: testUser.id,
      title: 'First Note',
      content: 'Content 1',
      tags: [],
      is_archived: false,
      embedding_status: 'pending',
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await db.insert(notes).values({
      user_id: testUser.id,
      title: 'Second Note',
      content: 'Content 2',
      tags: [],
      is_archived: false,
      embedding_status: 'pending',
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await db.insert(notes).values({
      user_id: testUser.id,
      title: 'Third Note',
      content: 'Content 3',
      tags: [],
      is_archived: false,
      embedding_status: 'pending',
    });

    const response = await testClient
      .get('/api/v1/notes?sort=created_at&order=desc')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.notes.length).toBe(3);

    // Newest first
    expect(data.data.notes[0].title).toBe('Third Note');
    expect(data.data.notes[2].title).toBe('First Note');
  });

  it('should sort by created_at ascending', async () => {
    // Create notes
    await db.insert(notes).values([
      {
        user_id: testUser.id,
        title: 'A Note',
        content: 'Content A',
        tags: [],
        is_archived: false,
        embedding_status: 'pending',
      },
      {
        user_id: testUser.id,
        title: 'B Note',
        content: 'Content B',
        tags: [],
        is_archived: false,
        embedding_status: 'pending',
      },
      {
        user_id: testUser.id,
        title: 'C Note',
        content: 'Content C',
        tags: [],
        is_archived: false,
        embedding_status: 'pending',
      },
    ]);

    const response = await testClient
      .get('/api/v1/notes?sort=created_at&order=asc')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);
    const data = await response.json();

    // Oldest first
    const timestamps = data.data.notes.map((n: any) =>
      new Date(n.created_at).getTime(),
    );
    expect(timestamps[0]).toBeLessThanOrEqual(timestamps[1]);
    expect(timestamps[1]).toBeLessThanOrEqual(timestamps[2]);
  });

  it('should sort by updated_at ascending', async () => {
    // Create initial note
    const [note1] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'Note 1',
        content: 'Content 1',
        tags: [],
        is_archived: false,
        embedding_status: 'pending',
      })
      .returning();

    // Wait and create second note
    await new Promise((resolve) => setTimeout(resolve, 10));

    const [note2] = await db
      .insert(notes)
      .values({
        user_id: testUser.id,
        title: 'Note 2',
        content: 'Content 2',
        tags: [],
        is_archived: false,
        embedding_status: 'pending',
      })
      .returning();

    // Wait and update the first note (should have newer updated_at)
    await new Promise((resolve) => setTimeout(resolve, 10));

    await db
      .update(notes)
      .set({ content: 'Updated Content 1', updated_at: new Date() })
      .where(eq(notes.id, note1.id));

    // Query with sort=updated_at&order=asc
    const response = await testClient
      .get('/api/v1/notes?sort=updated_at&order=asc')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.notes.length).toBe(2);

    // Note 2 should come first (older updated_at), then Note 1 (newer updated_at)
    expect(data.data.notes[0].id).toBe(note2.id);
    expect(data.data.notes[1].id).toBe(note1.id);

    // Verify timestamps are in ascending order
    const updatedAtTimestamps = data.data.notes.map((n: any) =>
      new Date(n.updated_at).getTime(),
    );
    expect(updatedAtTimestamps[0]).toBeLessThan(updatedAtTimestamps[1]);
  });

  it('should isolate users notes', async () => {
    // Create second user
    const passwordHash = await hashPassword('Password456');
    const [user2] = await db
      .insert(users)
      .values({
        email: 'user2@example.com',
        password_hash: passwordHash,
        name: 'User 2',
        terms_accepted_at: new Date(),
      })
      .returning();

    const accessToken2 = await signAccessToken(user2.id);

    // Create note for first user
    await db.insert(notes).values({
      user_id: testUser.id,
      title: 'User 1 Note',
      content: 'User 1 content',
      tags: [],
      is_archived: false,
      embedding_status: 'pending',
    });

    // Create note for second user
    await db.insert(notes).values({
      user_id: user2.id,
      title: 'User 2 Note',
      content: 'User 2 content',
      tags: [],
      is_archived: false,
      embedding_status: 'pending',
    });

    // User 1 should only see their note
    const response1 = await testClient
      .get('/api/v1/notes')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    const data1 = await response1.json();
    expect(data1.data.notes.length).toBe(1);
    expect(data1.data.notes[0].title).toBe('User 1 Note');

    // User 2 should only see their note
    const response2 = await testClient
      .get('/api/v1/notes')
      .header('authorization', `Bearer ${accessToken2}`)
      .json();

    const data2 = await response2.json();
    expect(data2.data.notes.length).toBe(1);
    expect(data2.data.notes[0].title).toBe('User 2 Note');
  });

  it('should require authentication', async () => {
    const response = await testClient.get('/api/v1/notes').json();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject invalid sort field', async () => {
    const response = await testClient
      .get('/api/v1/notes?sort=invalid_field')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid order value', async () => {
    const response = await testClient
      .get('/api/v1/notes?order=invalid')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return empty list when user has no notes', async () => {
    const response = await testClient
      .get('/api/v1/notes')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.notes).toEqual([]);
    expect(data.data.pagination.total).toBe(0);
    expect(data.data.pagination.total_pages).toBe(0);
  });
});
