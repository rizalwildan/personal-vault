import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { db } from '@/db';
import { notes, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('Notes Table Integration Tests', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create a test user
    const [user] = await db
      .insert(users)
      .values({
        email: `test${Date.now()}@example.com`,
        password_hash: 'hashedpassword',
        name: 'Test User',
      })
      .returning({ id: users.id });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up: delete test user (cascade deletes notes)
    await db.delete(users).where(eq(users.id, testUserId));
  });

  test('should create note with default values', async () => {
    const [note] = await db
      .insert(notes)
      .values({
        user_id: testUserId,
        title: 'Test Note',
        content: 'Test content',
      })
      .returning();

    expect(note.id).toBeDefined();
    expect(note.user_id).toBe(testUserId);
    expect(note.title).toBe('Test Note');
    expect(note.content).toBe('Test content');
    expect(note.embedding_status).toBe('pending');
    expect(note.tags).toEqual([]);
    expect(note.is_archived).toBe(false);
    expect(note.created_at).toBeInstanceOf(Date);
    expect(note.updated_at).toBeInstanceOf(Date);
  });

  test('should create note with tags', async () => {
    const [note] = await db
      .insert(notes)
      .values({
        user_id: testUserId,
        title: 'Tagged Note',
        content: 'Content with tags',
        tags: ['tag1', 'tag2'],
      })
      .returning();

    expect(note.tags).toEqual(['tag1', 'tag2']);
  });

  test('should update note and trigger updated_at', async () => {
    const [note] = await db
      .insert(notes)
      .values({
        user_id: testUserId,
        title: 'Original Title',
        content: 'Original content',
      })
      .returning();

    const originalUpdatedAt = note.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    await db
      .update(notes)
      .set({ title: 'Updated Title' })
      .where(eq(notes.id, note.id));

    const [updatedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, note.id));

    expect(updatedNote.title).toBe('Updated Title');
    expect(updatedNote.updated_at.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime(),
    );
  });

  test('should reset embedding_status when content changes', async () => {
    const [note] = await db
      .insert(notes)
      .values({
        user_id: testUserId,
        title: 'Note',
        content: 'Original content',
        embedding_status: 'completed', // manually set
      })
      .returning();

    expect(note.embedding_status).toBe('completed');

    await db
      .update(notes)
      .set({ content: 'Updated content' })
      .where(eq(notes.id, note.id));

    const [updatedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, note.id));

    expect(updatedNote.embedding_status).toBe('pending');
    expect(updatedNote.embedding).toBeNull();
  });

  test('should not reset embedding_status when only title changes', async () => {
    const [note] = await db
      .insert(notes)
      .values({
        user_id: testUserId,
        title: 'Original Title',
        content: 'Content',
        embedding_status: 'completed',
      })
      .returning();

    await db
      .update(notes)
      .set({ title: 'New Title' })
      .where(eq(notes.id, note.id));

    const [updatedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, note.id));

    expect(updatedNote.embedding_status).toBe('completed');
  });

  test('should cascade delete notes when user is deleted', async () => {
    const [note] = await db
      .insert(notes)
      .values({
        user_id: testUserId,
        title: 'Note to be deleted',
        content: 'Content',
      })
      .returning();

    // Verify note exists
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, note.id));
    expect(existingNote).toBeDefined();

    // Delete user
    await db.delete(users).where(eq(users.id, testUserId));

    // Verify note is deleted
    const deletedNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.id, note.id));
    expect(deletedNotes.length).toBe(0);
  });
});
