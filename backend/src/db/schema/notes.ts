import { pgTable, uuid } from 'drizzle-orm/pg-core';

// Placeholder table - Epic 3 will add full columns
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
});
