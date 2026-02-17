import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  customType,
  index,
} from 'drizzle-orm/pg-core';
import { sql, desc } from 'drizzle-orm';
import { users } from './users';

// Define vector type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 384})`;
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

// Enum for embedding status
export const embeddingStatusEnum = pgEnum('embedding_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

// Notes table
export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 384 }),
    embedding_status: embeddingStatusEnum('embedding_status')
      .default('pending')
      .notNull(),
    tags: text('tags').array().notNull().default([]),
    is_archived: boolean('is_archived').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdCreatedAtIdx: index('notes_user_id_created_at_idx').on(
      table.user_id,
      desc(table.created_at),
    ),
    userIdUpdatedAtIdx: index('notes_user_id_updated_at_idx').on(
      table.user_id,
      desc(table.updated_at),
    ),
    embeddingStatusIdx: index('notes_embedding_status_idx')
      .on(table.embedding_status)
      .where(sql`${table.embedding_status} != 'completed'`),
    tagsGinIdx: index('notes_tags_gin_idx').on(table.tags),
    embeddingHnswIdx: index('notes_embedding_hnsw_idx').on(table.embedding),
    isArchivedIdx: index('notes_is_archived_idx')
      .on(table.user_id, table.is_archived)
      .where(sql`${table.is_archived} = false`),
  }),
);

// Triggers
export const updateUpdatedAtTrigger = sql`
CREATE OR REPLACE FUNCTION update_updated_at_notes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_updated_at_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_notes();
`;

export const resetEmbeddingTrigger = sql`
CREATE OR REPLACE FUNCTION reset_embedding_on_content_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content != NEW.content THEN
    NEW.embedding_status = 'pending';
    NEW.embedding = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_embedding_on_content_change_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION reset_embedding_on_content_change();
`;
