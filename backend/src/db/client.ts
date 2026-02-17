import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

// Use connection pooling appropriate for environment
const connectionConfig =
  env.NODE_ENV === 'test'
    ? { max: 1, idle_timeout: 0, max_lifetime: 0 }
    : undefined;

const queryClient = postgres(env.DATABASE_URL, connectionConfig);

export const db = drizzle(queryClient, { schema });

export { sql } from 'drizzle-orm';
