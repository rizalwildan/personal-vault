import { embeddingService } from '../services/embedding.service';

const MAX_CONCURRENT = 5;

export class EmbeddingQueue {
  private readonly queue: string[] = [];
  private isProcessing = false;
  private readonly processing = new Set<string>();

  async enqueue(noteId: string): Promise<void> {
    // Prevent duplicate processing
    if (this.processing.has(noteId) || this.queue.includes(noteId)) {
      console.log(`⚠️ Note ${noteId} already in queue or processing`);
      return;
    }

    this.queue.push(noteId);
    console.log(
      `📋 Enqueued note ${noteId} for embedding. Queue size: ${this.queue.length}`,
    );

    // Start processing if not already
    this.process();
  }

  private async process(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 || this.processing.size > 0) {
      // Wait for available slots
      while (this.processing.size >= MAX_CONCURRENT) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Dequeue next item; if queue is empty but items are still processing,
      // wait and loop rather than breaking — breaking would reset isProcessing
      // prematurely and allow concurrent process() loops to start.
      const noteId = this.queue.shift();
      if (!noteId) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      // Start processing
      this.processing.add(noteId);
      console.log(
        `🔄 Processing embedding for note ${noteId}. Concurrent: ${this.processing.size}/${MAX_CONCURRENT}`,
      );

      // Process in background
      embeddingService
        .processNote(noteId)
        .catch((error: any) => {
          console.error(`❌ Error processing note ${noteId}:`, error);
        })
        .finally(() => {
          this.processing.delete(noteId);
          console.log(
            `✅ Finished processing note ${noteId}. Remaining in queue: ${this.queue.length}`,
          );
        });
    }

    this.isProcessing = false;
  }

  getStatus() {
    return {
      queueSize: this.queue.length,
      processingCount: this.processing.size,
      maxConcurrent: MAX_CONCURRENT,
    };
  }
}

export const embeddingQueue = new EmbeddingQueue();
