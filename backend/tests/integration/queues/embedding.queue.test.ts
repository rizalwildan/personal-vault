import {
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'bun:test';
import { db } from '../../../src/db/client';
import { embeddingQueue } from '../../../src/queues/embedding.queue';
import { embeddingService } from '../../../src/services/embedding.service';
import { notes, users } from '../../../src/db/schema';
import { eq } from 'drizzle-orm';

// Initialize the embedding service before running tests
beforeAll(async () => {
  await embeddingService.initialize();
}, 120000); // 2 minute timeout for model download/initialization

describe('EmbeddingQueue', () => {
  let testUserId: string;
  let testNoteId: string;

  beforeEach(async () => {
    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: `test${Date.now()}@example.com`,
        password_hash: 'hash',
        name: 'Test User',
      })
      .returning();
    testUserId = user.id;

    // Create test note
    const [note] = await db
      .insert(notes)
      .values({
        user_id: testUserId,
        title: 'Test Note',
        content: 'This is test content for embedding.',
        embedding_status: 'pending',
      })
      .returning();
    testNoteId = note.id;
  });

  afterEach(async () => {
    // Clean up (cascade delete via user)
    await db.delete(users).where(eq(users.id, testUserId));
  });

  test('should enqueue and process embedding', async () => {
    await embeddingQueue.enqueue(testNoteId);

    // Wait for processing (poll with timeout)
    let completed = false;
    for (let i = 0; i < 30; i++) {
      const note = await db.query.notes.findFirst({
        where: eq(notes.id, testNoteId),
      });
      if (note?.embedding_status === 'completed' && note.embedding) {
        completed = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    expect(completed).toBe(true);
  });

  test('should process up to MAX_CONCURRENT notes simultaneously', async () => {
    // Create 5 test notes
    const noteIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const [note] = await db
        .insert(notes)
        .values({
          user_id: testUserId,
          title: `Test Note ${i}`,
          content: `Test content ${i} for embedding.`,
          embedding_status: 'pending',
        })
        .returning();
      noteIds.push(note.id);
    }

    // Enqueue all 5
    for (const id of noteIds) {
      await embeddingQueue.enqueue(id);
    }

    // Wait for all to complete
    let allCompleted = false;
    for (let i = 0; i < 60; i++) {
      const notesResult = await db.query.notes.findMany({
        where: eq(notes.user_id, testUserId),
      });
      const completedCount = notesResult.filter(
        (n) => n.embedding_status === 'completed',
      ).length;
      if (completedCount === 5) {
        allCompleted = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    expect(allCompleted).toBe(true);

    // Clean up additional notes
    for (const id of noteIds) {
      await db.delete(notes).where(eq(notes.id, id));
    }
  });

  test('should process more than MAX_CONCURRENT by queuing', async () => {
    // Create 10 test notes
    const noteIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const [note] = await db
        .insert(notes)
        .values({
          user_id: testUserId,
          title: `Test Note ${i}`,
          content: `Test content ${i} for embedding.`,
          embedding_status: 'pending',
        })
        .returning();
      noteIds.push(note.id);
    }

    // Enqueue all 10
    for (const id of noteIds) {
      await embeddingQueue.enqueue(id);
    }

    // Wait for all to complete
    let allCompleted = false;
    for (let i = 0; i < 120; i++) {
      const notesResult = await db.query.notes.findMany({
        where: eq(notes.user_id, testUserId),
      });
      const completedCount = notesResult.filter(
        (n) => n.embedding_status === 'completed',
      ).length;
      if (completedCount === 10) {
        allCompleted = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    expect(allCompleted).toBe(true);

    // Clean up additional notes
    for (const id of noteIds) {
      await db.delete(notes).where(eq(notes.id, id));
    }
  });

  test('should prevent duplicate processing', async () => {
    // Enqueue same note twice
    await embeddingQueue.enqueue(testNoteId);
    await embeddingQueue.enqueue(testNoteId);

    // Wait a bit
    await new Promise((r) => setTimeout(r, 500));

    // Check queue status - should not have duplicates
    const status = embeddingQueue.getStatus();
    expect(status.queueSize).toBe(0); // Should be processed or processing
  });

  test('should handle retry logic on failure', async () => {
    // Mock the service to fail twice, then succeed
    const originalGenerateEmbedding =
      embeddingService.generateEmbedding.bind(embeddingService);
    let attemptCount = 0;

    // Replace generateEmbedding with a mock that fails twice
    embeddingService.generateEmbedding = async (text: string) => {
      attemptCount++;
      if (attemptCount <= 2) {
        throw new Error('Simulated temporary failure');
      }
      // On third attempt, succeed
      return originalGenerateEmbedding(text);
    };

    try {
      await embeddingQueue.enqueue(testNoteId);

      // Wait for processing with retries (should retry twice then succeed)
      let completed = false;
      for (let i = 0; i < 60; i++) {
        const note = await db.query.notes.findFirst({
          where: eq(notes.id, testNoteId),
        });
        if (note?.embedding_status === 'completed') {
          completed = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      expect(completed).toBe(true);
      expect(attemptCount).toBe(3); // Should have been called 3 times (2 failures + 1 success)

      // Verify final note has embedding
      const finalNote = await db.query.notes.findFirst({
        where: eq(notes.id, testNoteId),
      });
      expect(finalNote?.embedding).not.toBeNull();
    } finally {
      // Restore original method
      embeddingService.generateEmbedding = originalGenerateEmbedding;
    }
  }, 10000); // 10 second timeout (retry delays: 1s + 2s = 3s + processing time)

  test('should mark as failed after max retries', async () => {
    // Mock the service to always fail
    const originalGenerateEmbedding =
      embeddingService.generateEmbedding.bind(embeddingService);
    let attemptCount = 0;

    // Replace generateEmbedding with a mock that always fails
    embeddingService.generateEmbedding = async (_text: string) => {
      attemptCount++;
      throw new Error('Simulated permanent failure');
    };

    try {
      await embeddingQueue.enqueue(testNoteId);

      // Wait for processing to complete with max retries
      let hasFailed = false;
      for (let i = 0; i < 60; i++) {
        const note = await db.query.notes.findFirst({
          where: eq(notes.id, testNoteId),
        });
        if (note?.embedding_status === 'failed') {
          hasFailed = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      expect(hasFailed).toBe(true);
      expect(attemptCount).toBe(4); // Should have been called 4 times (1 initial + 3 retries) before giving up

      // Verify final note status and no embedding
      const finalNote = await db.query.notes.findFirst({
        where: eq(notes.id, testNoteId),
      });
      expect(finalNote?.embedding_status).toBe('failed');
      expect(finalNote?.embedding).toBeNull();
    } finally {
      // Restore original method
      embeddingService.generateEmbedding = originalGenerateEmbedding;
    }
  }, 15000); // 15 second timeout (retry delays: 1s + 2s + 4s = 7s + processing time)
});
