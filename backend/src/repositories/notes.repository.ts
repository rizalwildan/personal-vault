import { db } from '../db/client';
import { notes } from '../db/schema';
import { eq } from 'drizzle-orm';

export class NotesRepository {
  async findById(noteId: string) {
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    return note || null;
  }

  async updateEmbeddingStatus(
    noteId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
  ) {
    await db
      .update(notes)
      .set({ embedding_status: status })
      .where(eq(notes.id, noteId));
  }

  async updateEmbedding(
    noteId: string,
    embedding: number[],
    status: 'completed',
  ) {
    await db
      .update(notes)
      .set({
        embedding: embedding,
        embedding_status: status,
      })
      .where(eq(notes.id, noteId));
  }
}

export const notesRepository = new NotesRepository();
