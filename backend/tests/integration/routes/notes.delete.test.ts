import { describe, it, expect, beforeEach } from 'bun:test';
import { testClient } from '../../test-utils';
import { db } from '../../../src/db/client';
import { users, sessions, notes } from '../../../src/db/schema';
import { hashPassword, signAccessToken } from '../../../src/utils/auth';
import { eq } from 'drizzle-orm';

describe('DELETE /api/v1/notes/:id', () => {
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

  it('should soft delete successfully', async () => {
    const response = await testClient
      .delete(`/api/v1/notes/${testNote.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBe(null);

    // Verify in DB: is_archived=true
    const [deletedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, testNote.id));

    expect(deletedNote).toBeDefined();
    expect(deletedNote.is_archived).toBe(true);
  });

  it('should not hard delete - note still exists in database', async () => {
    await testClient
      .delete(`/api/v1/notes/${testNote.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    // Verify note still exists
    const [deletedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, testNote.id));

    expect(deletedNote).toBeDefined();
    expect(deletedNote.title).toBe('Test Note');
    expect(deletedNote.content).toBe('Test content');
  });

  it('should exclude deleted note from default list', async () => {
    // Delete note
    await testClient
      .delete(`/api/v1/notes/${testNote.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    // Get notes list (default is_archived=false)
    const listResponse = await testClient
      .get('/api/v1/notes')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    const listBody = await listResponse.json();
    expect(listBody.success).toBe(true);
    expect(listBody.data.notes.length).toBe(0);
  });

  it('should include deleted note when is_archived=true', async () => {
    // Delete note
    await testClient
      .delete(`/api/v1/notes/${testNote.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    // Get notes list with is_archived=true
    const listResponse = await testClient
      .get('/api/v1/notes?is_archived=true')
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    const listBody = await listResponse.json();
    expect(listBody.success).toBe(true);
    expect(listBody.data.notes.length).toBe(1);
    expect(listBody.data.notes[0].id).toBe(testNote.id);
    expect(listBody.data.notes[0].is_archived).toBe(true);
  });

  it('should return 404 when note does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await testClient
      .delete(`/api/v1/notes/${nonExistentId}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should return 404 when user tries to delete other user note', async () => {
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

    // Try to delete other user's note with testUser token
    const response = await testClient
      .delete(`/api/v1/notes/${otherNote.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should handle double-delete safely (idempotent)', async () => {
    // First delete
    const response1 = await testClient
      .delete(`/api/v1/notes/${testNote.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response1.status).toBe(200);

    // Second delete (same note - still exists in DB, still belongs to user)
    // Soft delete is idempotent: setting is_archived=true twice has same effect
    const response2 = await testClient
      .delete(`/api/v1/notes/${testNote.id}`)
      .header('authorization', `Bearer ${accessToken}`)
      .json();

    expect(response2.status).toBe(200);

    const body = await response2.json();
    expect(body.success).toBe(true);
  });
});
