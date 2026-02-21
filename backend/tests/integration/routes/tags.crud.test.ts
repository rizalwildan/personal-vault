import { describe, it, expect, beforeEach } from 'bun:test';
import { testClient } from '../../test-utils';
import { db } from '../../../src/db/client';
import { users, sessions, notes, tags } from '../../../src/db/schema';
import { hashPassword, signAccessToken } from '../../../src/utils/auth';
import { eq, sql } from 'drizzle-orm';

describe('Tags CRUD Integration Tests', () => {
  let testUser: any;
  let accessToken: string;

  beforeEach(async () => {
    // Clean database in reverse dependency order with CASCADE
    await db.execute(sql`TRUNCATE TABLE ${notes} CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${tags} CASCADE`);
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

  describe('GET /api/v1/tags', () => {
    it('returns empty array for new user', async () => {
      const response = await testClient
        .get('/api/v1/tags')
        .header('authorization', `Bearer ${accessToken}`)
        .json();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.tags).toEqual([]);
    });

    it('returns tags sorted alphabetically', async () => {
      // Insert tags out of alphabetical order
      await db.insert(tags).values([
        { user_id: testUser.id, name: 'kubernetes', color: '#FF0000' },
        { user_id: testUser.id, name: 'docker', color: '#3B82F6' },
        { user_id: testUser.id, name: 'testing', color: '#10B981' },
      ]);

      const response = await testClient
        .get('/api/v1/tags')
        .header('authorization', `Bearer ${accessToken}`)
        .json();

      expect(response.status).toBe(200);
      const data = await response.json();
      const names = data.data.tags.map((t: any) => t.name);
      expect(names).toEqual(['docker', 'kubernetes', 'testing']);
    });

    it('returns note_count for each tag', async () => {
      await db
        .insert(tags)
        .values({ user_id: testUser.id, name: 'docker' })
        .returning();

      // Create 2 notes with the tag
      await db.insert(notes).values([
        {
          user_id: testUser.id,
          title: 'Note 1',
          content: 'Content 1',
          tags: ['docker'],
          embedding_status: 'pending',
        },
        {
          user_id: testUser.id,
          title: 'Note 2',
          content: 'Content 2',
          tags: ['docker', 'other'],
          embedding_status: 'pending',
        },
      ]);

      const response = await testClient
        .get('/api/v1/tags')
        .header('authorization', `Bearer ${accessToken}`)
        .json();

      expect(response.status).toBe(200);
      const data = await response.json();
      const dockerTag = data.data.tags.find((t: any) => t.name === 'docker');
      expect(dockerTag).toBeDefined();
      expect(Number(dockerTag.note_count)).toBe(2);
    });
  });

  describe('POST /api/v1/tags', () => {
    it('creates tag successfully', async () => {
      const response = await testClient.post('/api/v1/tags').json(
        { name: 'docker', color: '#3B82F6' },
        { authorization: `Bearer ${accessToken}` },
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
      expect(data.data.name).toBe('docker');
      expect(data.data.color).toBe('#3B82F6');
      expect(data.data.user_id).toBe(testUser.id);
      expect(data.data.created_at).toBeDefined();
    });

    it('creates tag with lowercase hex color', async () => {
      const response = await testClient.post('/api/v1/tags').json(
        { name: 'frontend', color: '#3b82f6' },
        { authorization: `Bearer ${accessToken}` },
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.color).toBe('#3b82f6');
    });

    it('returns 409 when duplicate tag name', async () => {
      // Create first tag
      await testClient.post('/api/v1/tags').json(
        { name: 'docker' },
        { authorization: `Bearer ${accessToken}` },
      );

      // Try to create duplicate
      const response = await testClient.post('/api/v1/tags').json(
        { name: 'docker' },
        { authorization: `Bearer ${accessToken}` },
      );

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CONFLICT');
    });

    it('returns 400 for invalid color format', async () => {
      const response = await testClient.post('/api/v1/tags').json(
        { name: 'docker', color: 'notacolor' },
        { authorization: `Bearer ${accessToken}` },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/tags/:id', () => {
    it('updates tag name', async () => {
      const [tag] = await db
        .insert(tags)
        .values({ user_id: testUser.id, name: 'docker', color: '#3B82F6' })
        .returning();

      const response = await testClient
        .patch(`/api/v1/tags/${tag.id}`)
        .json({ name: 'container' }, { authorization: `Bearer ${accessToken}` });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('container');
      expect(data.data.color).toBe('#3B82F6');
    });

    it('updates tag color', async () => {
      const [tag] = await db
        .insert(tags)
        .values({ user_id: testUser.id, name: 'docker', color: '#3B82F6' })
        .returning();

      const response = await testClient
        .patch(`/api/v1/tags/${tag.id}`)
        .json(
          { color: '#10B981' },
          { authorization: `Bearer ${accessToken}` },
        );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('docker');
      expect(data.data.color).toBe('#10B981');
    });

    it('returns 409 when renaming to duplicate name', async () => {
      await db.insert(tags).values([
        { user_id: testUser.id, name: 'docker' },
        { user_id: testUser.id, name: 'container' },
      ]);

      const [dockerTag] = await db
        .select()
        .from(tags)
        .where(eq(tags.name, 'docker'));

      const response = await testClient
        .patch(`/api/v1/tags/${dockerTag.id}`)
        .json(
          { name: 'container' },
          { authorization: `Bearer ${accessToken}` },
        );

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CONFLICT');
    });

    it('returns 404 for non-existent tag', async () => {
      const response = await testClient
        .patch('/api/v1/tags/00000000-0000-0000-0000-000000000000')
        .json({ name: 'new-name' }, { authorization: `Bearer ${accessToken}` });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/tags/:id', () => {
    it('deletes tag and returns 200', async () => {
      const [tag] = await db
        .insert(tags)
        .values({ user_id: testUser.id, name: 'docker' })
        .returning();

      const response = await testClient
        .delete(`/api/v1/tags/${tag.id}`)
        .header('authorization', `Bearer ${accessToken}`)
        .json();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('Tag deleted');
      expect(typeof data.data.notes_updated).toBe('number');

      // Verify tag is removed from DB
      const remaining = await db
        .select()
        .from(tags)
        .where(eq(tags.id, tag.id));
      expect(remaining).toHaveLength(0);
    });

    it('returns 404 for non-existent tag', async () => {
      const response = await testClient
        .delete('/api/v1/tags/00000000-0000-0000-0000-000000000000')
        .header('authorization', `Bearer ${accessToken}`)
        .json();

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Authentication', () => {
    it('requires authentication for GET', async () => {
      const response = await testClient.get('/api/v1/tags').json();
      expect(response.status).toBe(401);
    });

    it('requires authentication for POST', async () => {
      const response = await testClient
        .post('/api/v1/tags')
        .json({ name: 'docker' });
      expect(response.status).toBe(401);
    });
  });
});
