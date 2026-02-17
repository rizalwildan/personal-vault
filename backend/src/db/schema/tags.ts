import { pgTable, uuid } from 'drizzle-orm/pg-core';

// Placeholder table - Epic 3 will add full columns
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
});
