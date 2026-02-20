import { pipeline, env as transformersEnv } from '@xenova/transformers';
import { notesRepository } from '../repositories/notes.repository';

// Set cache directory for Transformers.js
transformersEnv.cacheDir = './.cache/transformers';

const MODEL_NAME = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const DIMENSIONS = 384;

export class EmbeddingService {
  private model: any = null;
  private isInitialized = false;
  private readonly processingQueue = new Set<string>();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔄 Initializing embedding model...');
    try {
      this.model = await pipeline('feature-extraction', MODEL_NAME, {
        quantized: false, // Use full precision for better quality
      });
      this.isInitialized = true;
      console.log('✅ Embedding model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load embedding model:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<Float32Array> {
    if (!this.isInitialized) {
      throw new Error('Embedding service not initialized');
    }

    const processedText = preprocessText(text);
    console.log(
      `🔄 Generating embedding for text: "${processedText.substring(0, 50)}..."`,
    );

    try {
      const output = await this.model(processedText, {
        pooling: 'mean',
        normalize: true,
      });

      const embedding = output.data as Float32Array;

      if (embedding.length !== DIMENSIONS) {
        throw new Error(
          `Invalid embedding dimensions: expected ${DIMENSIONS}, got ${embedding.length}`,
        );
      }

      console.log('✅ Embedding generated successfully');
      return embedding;
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      model: MODEL_NAME,
      dimensions: DIMENSIONS,
    };
  }

  // Placeholder for processNote - implemented in Task 6
  async processNote(noteId: string, retryCount = 0): Promise<void> {
    // Prevent duplicate processing
    if (this.processingQueue.has(noteId)) {
      console.log(`⚠️ Note ${noteId} already being processed`);
      return;
    }

    this.processingQueue.add(noteId);

    try {
      // Update status to processing
      await notesRepository.updateEmbeddingStatus(noteId, 'processing');

      // Fetch note content
      const note = await notesRepository.findById(noteId);
      if (!note) {
        console.error(`❌ Note ${noteId} not found`);
        await notesRepository.updateEmbeddingStatus(noteId, 'failed');
        return;
      }

      // Generate embedding
      const embedding = await this.generateEmbedding(note.content);

      // Store embedding
      await notesRepository.updateEmbedding(
        noteId,
        Array.from(embedding),
        'completed',
      );

      console.log(`✅ Embedding generated for note ${noteId}`);
    } catch (error) {
      console.error(
        `❌ Error processing note ${noteId} (attempt ${retryCount + 1}):`,
        error,
      );

      // Retry logic
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`🔄 Retrying note ${noteId} in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        // Must remove from processingQueue before recursing, otherwise the
        // duplicate-prevention check at the top of processNote will see the
        // noteId still present and return early without retrying.
        this.processingQueue.delete(noteId);
        return this.processNote(noteId, retryCount + 1);
      } else {
        // Permanent failure
        await notesRepository.updateEmbeddingStatus(noteId, 'failed');
        console.error(
          `❌ Embedding permanently failed for note ${noteId} after 3 retries`,
        );
      }
    } finally {
      this.processingQueue.delete(noteId);
    }
  }
}

export const embeddingService = new EmbeddingService();

// Exported module-level function for text preprocessing
export function preprocessText(text: string): string {
  // Remove markdown formatting symbols
  let cleaned = text.replaceAll(/[#*_~`]/g, '');

  // Extract link text, remove URLs
  cleaned = cleaned.replaceAll(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Replace multiple newlines with single space
  cleaned = cleaned.replaceAll(/\n+/g, ' ');

  // Trim whitespace
  cleaned = cleaned.trim();

  // Truncate to 2000 characters
  if (cleaned.length > 2000) {
    cleaned = cleaned.substring(0, 2000);
  }

  return cleaned;
}
