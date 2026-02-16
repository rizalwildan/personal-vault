# Testing Strategy

## Testing Pyramid

```
        /\
       /  \      E2E Tests (5%)
      /    \     - Critical user flows
     /------\    
    /        \   Integration Tests (25%)
   /          \  - API endpoint tests
  /------------\ - Database integration
 /              \
/________________\ Unit Tests (70%)
                   - Service layer
                   - Utility functions
                   - Components
```

---

## Frontend Testing

**Tools:**
- **Test Runner:** Vitest (fast, Vite-native)
- **Component Testing:** React Testing Library
- **E2E:** Playwright
- **Coverage:** c8 (built into Vitest)

**Unit Tests (`frontend/tests/unit/`):**

```typescript
// hooks/use-auth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '@/hooks/use-auth';

describe('useAuth', () => {
  it('should login and store tokens', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('access_token')).toBeTruthy();
  });
});
```

**Component Tests (`frontend/tests/components/`):**

```typescript
// components/notes/note-card.test.tsx
import { render, screen } from '@testing-library/react';
import { NoteCard } from '@/components/notes/note-card';

describe('NoteCard', () => {
  const mockNote = {
    id: '123',
    title: 'Test Note',
    content: 'This is test content...',
    tags: ['typescript', 'testing'],
    created_at: new Date().toISOString(),
  };

  it('should render note title and excerpt', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText(/This is test content/)).toBeInTheDocument();
  });

  it('should render tags as badges', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
  });
});
```

**E2E Tests (`frontend/tests/e2e/`):**

```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register, login, and access dashboard', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="name"]', 'Test User');
    await page.check('[name="terms"]');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
```

---

## Backend Testing

**Tools:**
- **Test Runner:** Bun Test (built-in, fast)
- **Mocking:** Bun's built-in mock system
- **Coverage:** Bun's built-in coverage tool

**Unit Tests (`backend/tests/unit/`):**

```typescript
// services/auth.service.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { authService } from '@/services/auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    // Clean up test data
  });

  test('should hash password correctly', async () => {
    const password = 'password123';
    const hash = await authService.hashPassword(password);
    
    expect(hash).not.toBe(password);
    expect(hash).toStartWith('$2b$'); // bcrypt prefix
  });

  test('should validate correct password', async () => {
    const password = 'password123';
    const hash = await authService.hashPassword(password);
    const isValid = await authService.verifyPassword(password, hash);
    
    expect(isValid).toBe(true);
  });

  test('should reject incorrect password', async () => {
    const password = 'password123';
    const hash = await authService.hashPassword(password);
    const isValid = await authService.verifyPassword('wrongpassword', hash);
    
    expect(isValid).toBe(false);
  });
});
```

**Integration Tests (`backend/tests/integration/`):**

```typescript
// routes/notes.routes.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { app } from '@/app';

describe('Notes API', () => {
  let authToken: string;
  let noteId: string;

  beforeAll(async () => {
    // Register test user and get token
    const response = await app.handle(
      new Request('http://localhost/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
          terms_accepted: true,
        }),
      })
    );
    const data = await response.json();
    authToken = data.data.access_token;
  });

  test('POST /notes should create note', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Note',
          content: 'This is a test note',
          tags: ['test'],
        }),
      })
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Test Note');
    noteId = data.data.id;
  });

  test('GET /notes/:id should return note', async () => {
    const response = await app.handle(
      new Request(`http://localhost/api/v1/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.id).toBe(noteId);
  });
});
```

---

## Test Coverage Requirements

**Targets:**
- Overall: >80%
- Services: >90%
- Repositories: >90%
- Routes: >85%
- Components: >75%
- Utilities: >95%

**Coverage Reports:**
```bash
# Frontend
pnpm --filter frontend test:coverage

# Backend
pnpm --filter backend test:coverage
```

---
