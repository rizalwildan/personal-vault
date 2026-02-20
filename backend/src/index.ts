import { app } from './app';
import { env } from './config/env';
import { db, sql } from './db/client';
import { embeddingService } from './services/embedding.service';

console.log('🚀 Starting Personal Vault Backend...');

// Verify database connection
try {
  await db.execute(sql`SELECT 1`);
  console.log('✅ Database connected');
} catch (error) {
  console.error('❌ Database connection failed:', error);
  process.exit(1);
}

// Initialize embedding service
try {
  await embeddingService.initialize();
  console.log('✅ Embedding model loaded');
} catch (error) {
  console.error('❌ Embedding service initialization failed:', error);
  process.exit(1);
}

app.listen(env.PORT);

console.log(`✅ Server running on http://localhost:${env.PORT}`);
console.log(`📖 Swagger docs: http://localhost:${env.PORT}/swagger`);
console.log(`🏥 Health check: http://localhost:${env.PORT}/health`);
