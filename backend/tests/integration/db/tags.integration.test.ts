import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { db } from '@/db';
import { tags, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('Tags Table Integration Tests', () => {
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
    // Clean up: delete test user (cascade deletes tags)
    await db.delete(users).where(eq(users.id, testUserId));
  });

  test('should create tag with required fields', async () => {
    const [tag] = await db
      .insert(tags)
      .values({
        user_id: testUserId,
        name: 'Test Tag',
      })
      .returning();

    expect(tag.id).toBeDefined();
    expect(tag.user_id).toBe(testUserId);
    expect(tag.name).toBe('Test Tag');
    expect(tag.color).toBeNull();
    expect(tag.created_at).toBeInstanceOf(Date);
  });

  test('should create tag with color', async () => {
    const [tag] = await db
      .insert(tags)
      .values({
        user_id: testUserId,
        name: 'Colored Tag',
        color: '#FF0000',
      })
      .returning();

    expect(tag.color).toBe('#FF0000');
  });

  test('should enforce unique constraint on (user_id, name)', async () => {
    await db.insert(tags).values({
      user_id: testUserId,
      name: 'Unique Tag',
    });

    // Try to insert duplicate
    expect(async () => {
      await db.insert(tags).values({
        user_id: testUserId,
        name: 'Unique Tag',
      });
    }).toThrow();
  });

  test('should allow same name for different users', async () => {
    // Create another user
    const [user2] = await db
      .insert(users)
      .values({
        email: `test2${Date.now()}@example.com`,
        password_hash: 'hashedpassword',
        name: 'Test User 2',
      })
      .returning({ id: users.id });

    await db.insert(tags).values({
      user_id: testUserId,
      name: 'Shared Name',
    });

    // Should succeed for different user
    const [tag2] = await db
      .insert(tags)
      .values({
        user_id: user2.id,
        name: 'Shared Name',
      })
      .returning();

    expect(tag2.name).toBe('Shared Name');

    // Clean up user2
    await db.delete(users).where(eq(users.id, user2.id));
  });

  test('should reject invalid color format', async () => {
    expect(async () => {
      await db.insert(tags).values({
        user_id: testUserId,
        name: 'Invalid Color Tag',
        color: '#GGG', // invalid hex
      });
    }).toThrow();
  });

  test('should cascade delete tags when user is deleted', async () => {
    const [tag] = await db
      .insert(tags)
      .values({
        user_id: testUserId,
        name: 'Tag to be deleted',
      })
      .returning();

    // Verify tag exists
    const [existingTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.id, tag.id));
    expect(existingTag).toBeDefined();

    // Delete user
    await db.delete(users).where(eq(users.id, testUserId));

    // Verify tag is deleted
    const deletedTags = await db.select().from(tags).where(eq(tags.id, tag.id));
    expect(deletedTags.length).toBe(0);
  });
});
