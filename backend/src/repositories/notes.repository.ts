import { db } from '../db/client';
import { notes } from '../db/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

interface CreateNoteInput {
  user_id: string;
  title: string;
  content: string;
  tags?: string[];
  is_archived?: boolean;
  embedding_status?: 'pending' | 'processing' | 'completed' | 'failed';
}

interface ListFilters {
  page: number;
  limit: number;
  tags?: string[];
  is_archived: boolean;
  sort: 'created_at' | 'updated_at';
  order: 'asc' | 'desc';
}

export class NotesRepository {
  async create(input: CreateNoteInput) {
    const [note] = await db
      .insert(notes)
      .values({
        user_id: input.user_id,
        title: input.title,
        content: input.content,
        tags: input.tags || [],
        is_archived: input.is_archived ?? false,
        embedding_status: input.embedding_status || 'pending',
      })
      .returning();

    return note;
  }

  async findById(noteId: string) {
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    return note || null;
  }

  async findByUserAndId(userId: string, noteId: string) {
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.user_id, userId)))
      .limit(1);

    return note || null;
  }

  async list(userId: string, filters: ListFilters) {
    const { page, limit, tags, is_archived, sort, order } = filters;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [
      eq(notes.user_id, userId),
      eq(notes.is_archived, is_archived),
    ];

    // Add tag filtering if provided (ANY match) - use OR logic for any tag match
    if (tags && tags.length > 0) {
      const tagConditions = tags.map((tag) => sql`${tag} = ANY(${notes.tags})`);
      const joinedTagConditions = sql.join(tagConditions, sql` OR `);
      conditions.push(sql`(${joinedTagConditions})`);
    }

    // Query total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notes)
      .where(and(...conditions));

    const total = countResult[0]?.count ?? 0;

    // Query paginated results
    const orderByClause =
      order === 'asc' ? asc(notes[sort]) : desc(notes[sort]);

    const result = await db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return {
      notes: result,
      total: Number(total),
      page,
      limit,
    };
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
