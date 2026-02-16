# Coding Standards

## TypeScript Configuration

**Strict Mode Enabled:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true
  }
}
```

---

## ESLint Rules

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

---

## Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `NoteCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useNotes.ts`)
- Services: `camelCase.service.ts` (e.g., `auth.service.ts`)
- Types: `PascalCase.ts` or `camelCase.types.ts`

**Variables:**
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- Functions: `camelCase` (e.g., `getUserById`)
- Classes: `PascalCase` (e.g., `NotesService`)
- Interfaces/Types: `PascalCase` (e.g., `User`, `CreateNoteInput`)

**React Components:**
- Props interface: `ComponentNameProps` (e.g., `NoteCardProps`)
- Event handlers: `handleEventName` (e.g., `handleSubmit`, `handleDelete`)
- State: descriptive names (e.g., `isLoading`, `notes`, `searchQuery`)

---

## Code Organization

**Imports Order:**
1. External dependencies (React, Next, etc.)
2. Internal absolute imports (`@/components`, `@/lib`)
3. Internal relative imports (`./utils`, `../types`)
4. Styles (if any)

```typescript
// Good
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/hooks/use-notes';
import { formatDate } from './utils';
```

---

## Documentation Standards

**JSDoc for Public APIs:**
```typescript
/**
 * Search notes using semantic similarity.
 * 
 * @param userId - The user ID to search notes for
 * @param query - Natural language search query
 * @param limit - Maximum number of results (default: 10)
 * @param threshold - Minimum similarity score 0.0-1.0 (default: 0.7)
 * @returns Array of notes with similarity scores
 * @throws {Error} If user not found or embedding service unavailable
 * 
 * @example
 * ```typescript
 * const results = await searchService.semanticSearch(
 *   'user-123',
 *   'python programming',
 *   10,
 *   0.7
 * );
 * ```
 */
async semanticSearch(
  userId: string,
  query: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<SearchResult[]> {
  // Implementation...
}
```

---
