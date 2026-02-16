# Frontend Architecture

This section describes the Next.js application structure, routing strategy, state management, and integration with the backend API.

## Technology Stack

- **Framework:** Next.js 16 with App Router
- **Runtime:** React 19 Server Components
- **Language:** TypeScript 5.7
- **Styling:** Tailwind CSS 3.4
- **UI Library:** shadcn/ui (Radix UI primitives)
- **State Management:** React hooks + SWR for server state
- **Forms:** react-hook-form + zod validation
- **Markdown:** react-markdown + remark-gfm + rehype-sanitize

---

## Directory Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── register/
│   │   │   └── page.tsx          # Registration page
│   │   └── layout.tsx            # Auth layout (centered card)
│   ├── (dashboard)/              # Dashboard route group (requires auth)
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard page
│   │   ├── notes/
│   │   │   ├── page.tsx          # Notes list page
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Note editor page
│   │   │   └── new/
│   │   │       └── page.tsx      # Create note page
│   │   ├── search/
│   │   │   └── page.tsx          # Search results page
│   │   └── layout.tsx            # Dashboard layout (sidebar + header)
│   ├── api/                      # API routes (BFF pattern if needed)
│   │   └── health/
│   │       └── route.ts          # Health check endpoint
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global Tailwind styles
│   └── not-found.tsx             # 404 page
├── components/                   # React components
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── auth-guard.tsx        # HOC for protected routes
│   ├── dashboard/
│   │   ├── dashboard-stats.tsx
│   │   ├── recent-notes.tsx
│   │   ├── mcp-status.tsx
│   │   └── sidebar.tsx
│   ├── notes/
│   │   ├── notes-list.tsx
│   │   ├── note-card.tsx
│   │   ├── note-editor.tsx
│   │   ├── markdown-preview.tsx
│   │   └── tag-selector.tsx
│   ├── search/
│   │   ├── search-bar.tsx
│   │   └── search-results.tsx
│   ├── providers/
│   │   ├── auth-provider.tsx
│   │   ├── theme-provider.tsx    # Dark mode provider
│   │   └── toast-provider.tsx
│   └── ui/                       # shadcn/ui components (40+ files)
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── ... (see components.json)
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Authentication hook
│   ├── use-notes.ts              # Notes data fetching
│   ├── use-search.ts             # Semantic search
│   ├── use-tags.ts               # Tags management
│   └── use-debounce.ts           # Utility hook
├── lib/                          # Utility libraries
│   ├── api-client.ts             # Axios instance with auth interceptor
│   ├── auth.ts                   # Token management utilities
│   ├── utils.ts                  # cn() helper, date formatting, etc.
│   └── constants.ts              # API base URL, config values
├── types/                        # Frontend-specific types
│   └── index.ts                  # Re-export shared schemas
├── public/                       # Static assets
│   ├── favicon.ico
│   └── images/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── components.json               # shadcn/ui config
└── next.config.mjs
```

---

## Routing Strategy

**Route Groups:** Use Next.js 15+ route groups for layout separation

1. **(auth)** - Public routes with centered card layout
   - `/login` - Login page
   - `/register` - Registration page

2. **(dashboard)** - Protected routes with sidebar + header layout
   - `/dashboard` - Overview with stats and recent notes
   - `/notes` - Notes list with filters
   - `/notes/new` - Create new note
   - `/notes/[id]` - Edit note (split view editor)
   - `/search` - Semantic search results

**Route Protection:**
- Middleware checks authentication on all `(dashboard)` routes
- Unauthenticated users redirected to `/login`
- Authenticated users on `/login` redirected to `/dashboard`

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/notes') ||
                          request.nextUrl.pathname.startsWith('/search');

  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## State Management

**Philosophy:** Minimal client state, leverage React Server Components for data fetching where possible.

### Authentication State

**Storage:** localStorage for tokens, React Context for user state

```typescript
// components/providers/auth-provider.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContext {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from token on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      // Decode JWT to get user info (or fetch from API)
      const decoded = decodeJWT(token);
      setUser(decoded.user);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { user, access_token, refresh_token } = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(user);
  };

  const logout = async () => {
    const refresh_token = localStorage.getItem('refresh_token');
    await apiClient.post('/auth/logout', { refresh_token });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

### Server State (Notes, Tags)

**Strategy:** Use SWR for data fetching with optimistic updates

```typescript
// hooks/use-notes.ts
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import type { Note } from '@/types';

export function useNotes(filters?: NotesFilters) {
  const { data, error, mutate } = useSWR<{ notes: Note[]; pagination: Pagination }>(
    ['/notes', filters],
    ([url, filters]) => apiClient.get(url, { params: filters })
  );

  const createNote = async (note: CreateNoteInput) => {
    // Optimistic update
    const tempNote = { ...note, id: 'temp', embedding_status: 'pending', created_at: new Date() };
    mutate({ ...data, notes: [tempNote, ...data.notes] }, false);

    try {
      const created = await apiClient.post('/notes', note);
      mutate(); // Revalidate
      return created;
    } catch (error) {
      mutate(); // Rollback on error
      throw error;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    // Optimistic update
    mutate(
      { ...data, notes: data.notes.map(n => n.id === id ? { ...n, ...updates } : n) },
      false
    );

    try {
      const updated = await apiClient.patch(`/notes/${id}`, updates);
      mutate();
      return updated;
    } catch (error) {
      mutate();
      throw error;
    }
  };

  const deleteNote = async (id: string) => {
    // Optimistic update
    mutate({ ...data, notes: data.notes.filter(n => n.id !== id) }, false);

    try {
      await apiClient.delete(`/notes/${id}`);
      mutate();
    } catch (error) {
      mutate();
      throw error;
    }
  };

  return {
    notes: data?.notes || [],
    pagination: data?.pagination,
    isLoading: !data && !error,
    error,
    createNote,
    updateNote,
    deleteNote,
    refresh: mutate,
  };
}
```

---

## API Integration

**Client:** Axios with interceptors for auth and error handling

```typescript
// lib/api-client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token refresh
apiClient.interceptors.response.use(
  (response) => response.data.data, // Extract data field
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem('refresh_token');
        const { access_token } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refresh_token }
        );
        localStorage.setItem('access_token', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

## Performance Optimizations

1. **React Server Components** - Fetch data on server, reduce client JavaScript
2. **Code Splitting** - Dynamic imports for heavy components (markdown editor)
3. **Image Optimization** - Next.js `<Image>` component for avatars
4. **Font Optimization** - Geist font with `subsets: ['latin']`
5. **Debounced Search** - 300ms debounce on search input
6. **Pagination** - Load 50 notes per page, virtual scrolling for large lists
7. **SWR Cache** - In-memory cache for API responses, revalidate on focus
8. **Optimistic Updates** - Instant UI feedback on mutations

---

## Accessibility

- **WCAG 2.1 AA compliance** via Radix UI primitives
- **Keyboard navigation** - Full keyboard support for all interactions
- **Screen reader support** - ARIA labels on all interactive elements
- **Focus management** - Visible focus indicators, logical tab order
- **Color contrast** - 4.5:1 minimum contrast ratio
- **Dark mode** - Respects system preference, manual toggle

---

