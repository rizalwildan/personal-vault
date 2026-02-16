# Error Handling Strategy

## Frontend Error Handling

**Hierarchy:**
1. **Component Level** - Try/catch in event handlers
2. **Hook Level** - Error state in custom hooks
3. **API Level** - Axios interceptor for global errors
4. **Application Level** - React Error Boundary

**Error Boundary:**
```typescript
// components/error-boundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
    // Send to error tracking service (future)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Backend Error Handling

**Error Types:**

```typescript
// types/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}
```

**Usage in Services:**

```typescript
// services/notes.service.ts
export class NotesService {
  async getById(noteId: string, userId: string): Promise<Note> {
    const note = await this.notesRepo.findById(noteId);

    if (!note) {
      throw new NotFoundError('Note');
    }

    if (note.user_id !== userId) {
      throw new UnauthorizedError('You do not have access to this note');
    }

    return note;
  }
}
```

---

## Logging Strategy

**Log Levels:**
- `ERROR` - Application errors, unhandled exceptions
- `WARN` - Recoverable issues, deprecated usage
- `INFO` - Important business events (user registered, note created)
- `DEBUG` - Detailed diagnostic information (development only)

**Structured Logging:**

```typescript
// utils/logger.ts
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Usage
logger.info('User registered', { userId: '123', email: 'user@example.com' });
logger.error('Embedding generation failed', { noteId: '456', error: error.message });
```

---
