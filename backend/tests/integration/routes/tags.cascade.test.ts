import { describe, it, expect, beforeEach } from 'bun:test';
import { testClient } from '../../test-utils';
import { db } from '../../../src/db/client';
import { users, sessions, notes, tags } from '../../../src/db/schema';
import { hashPassword, signAccessToken } from '../../../src/utils/auth';
import { eq, asc, sql } from 'drizzle-orm';

describe('Tags Cascade Delete Integration Tests', () => {
  let testUser: any;
  let accessToken: string;

  beforeEach(async () => {
    // Clean database
    await db.delete(tags);
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

  it('delete tag removes from all notes', async () => {
    // Create tag
    const [tag] = await db
      .insert(tags)
      .values({
        user_id: testUser.id,
        name: 'docker',
        color: '#3B82F6',
      })
      .returning();

    // Create notes with the tag
    await db.insert(notes).values([
      {
        user_id: testUser.id,
        title: 'Note 1',
        content: 'Content 1',
        tags: ['docker', 'other'],
        embedding_status: 'completed',
      },
      {
        user_id: testUser.id,
        title: 'Note 2',
        content: 'Content 2',
        tags: ['docker'],
        embedding_status: 'completed',
      },
      {
        user_id: testUser.id,
        title: 'Note 3',
        content: 'Content 3',
        tags: ['other'],
        embedding_status: 'completed',
      },
    ]);

    // Delete tag
    const response = await testClient
      .delete(`/api/v1/tags/${tag.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.message).toBe('Tag deleted');
    expect(data.data.notes_updated).toBe(2); // 2 notes had the tag

    // Verify notes no longer have the tag
    const updatedNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.user_id, testUser.id))
      .orderBy(asc(notes.title));
    const note1 = updatedNotes.find((n) => n.title === 'Note 1');
    const note2 = updatedNotes.find((n) => n.title === 'Note 2');
    const note3 = updatedNotes.find((n) => n.title === 'Note 3');

    expect(note1!.tags).toEqual(['other']); // Note 1: docker removed, other remains
    expect(note2!.tags).toEqual([]); // Note 2: docker removed, empty array
    expect(note3!.tags).toEqual(['other']); // Note 3: unchanged
  });

  it('delete tag with no notes using it', async () => {
    // Create tag
    const [tag] = await db
      .insert(tags)
      .values({
        user_id: testUser.id,
        name: 'unused',
        color: '#FF0000',
      })
      .returning();

    // Delete tag
    const response = await testClient
      .delete(`/api/v1/tags/${tag.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.notes_updated).toBe(0);
  });

  it('delete tag does not affect other users tags', async () => {
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

    // Create same tag for both users
    const [tag1] = await db
      .insert(tags)
      .values({
        user_id: testUser.id,
        name: 'docker',
        color: '#3B82F6',
      })
      .returning();

    await db.insert(tags).values({
      user_id: user2.id,
      name: 'docker',
      color: '#3B82F6',
    });

    // Delete tag for user 1
    const response = await testClient
      .delete(`/api/v1/tags/${tag1.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);

    // Verify user 2's tag still exists
    const remainingTags = await db
      .select()
      .from(tags)
      .where(eq(tags.user_id, user2.id));
    expect(remainingTags).toHaveLength(1);
    expect(remainingTags[0].name).toBe('docker');
  });
});
