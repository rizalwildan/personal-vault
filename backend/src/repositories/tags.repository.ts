import { db } from '../db/client';
import { tags, notes } from '../db/schema';
import { eq, and, sql, asc } from 'drizzle-orm';

interface CreateTagInput {
  user_id: string;
  name: string;
  color?: string;
}

interface UpdateTagInput {
  name?: string;
  color?: string;
}

export class TagsRepository {
  async findByUserAndId(userId: string, tagId: string) {
    const [tag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, tagId), eq(tags.user_id, userId)))
      .limit(1);

    return tag || null;
  }

  async create(input: CreateTagInput) {
    const [tag] = await db
      .insert(tags)
      .values({
        user_id: input.user_id,
        name: input.name,
        color: input.color,
      })
      .returning();

    return tag;
  }

  async list(userId: string) {
    const result = await db
      .select({
        id: tags.id,
        user_id: tags.user_id,
        name: tags.name,
        color: tags.color,
        created_at: tags.created_at,
        note_count: sql<number>`COUNT(${notes.id})`,
      })
      .from(tags)
      .leftJoin(
        notes,
        and(
          eq(notes.user_id, tags.user_id),
          sql`${tags.name} = ANY(${notes.tags})`,
        ),
      )
      .where(eq(tags.user_id, userId))
      .groupBy(tags.id)
      .orderBy(asc(tags.name));

    return result;
  }

  async update(tagId: string, userId: string, updates: UpdateTagInput) {
    const [tag] = await db
      .update(tags)
      .set(updates)
      .where(and(eq(tags.id, tagId), eq(tags.user_id, userId)))
      .returning();

    return tag || null;
  }

  async delete(tagId: string) {
    await db.delete(tags).where(eq(tags.id, tagId));
  }

  async removeTagFromNotes(userId: string, tagName: string): Promise<number> {
    const userNotes = await db
      .select()
      .from(notes)
      .where(
        and(eq(notes.user_id, userId), sql`${notes.tags} @> ARRAY[${tagName}]`),
      );

    for (const note of userNotes) {
      const newTags = note.tags.filter((t) => t !== tagName);
      await db
        .update(notes)
        .set({ tags: newTags })
        .where(eq(notes.id, note.id));
    }

    return userNotes.length;
  }

  async findByName(userId: string, name: string) {
    const [tag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.user_id, userId), eq(tags.name, name)))
      .limit(1);

    return tag || null;
  }
}

export const tagsRepository = new TagsRepository();
