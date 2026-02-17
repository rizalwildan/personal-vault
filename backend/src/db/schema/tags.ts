import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

// Tags table
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 50 }).notNull(),
    color: varchar('color', { length: 7 }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueUserName: uniqueIndex('tags_user_id_name_unique').on(
      table.user_id,
      table.name,
    ),
    colorCheck: check(
      'tags_color_check',
      sql`${table.color} ~ '^#[0-9A-Fa-f]{6}$' OR ${table.color} IS NULL`,
    ),
  }),
);
