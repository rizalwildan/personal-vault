import { pgTable, uuid } from 'drizzle-orm/pg-core';

// Placeholder table - Epic 2 will add full columns
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
});
