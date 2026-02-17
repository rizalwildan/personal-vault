# Epic 5: Frontend Authentication Logic

**Status:** Not Started
**Priority:** HIGH
**Estimated Duration:** 3-4 days
**Dependencies:** Epic 2 (Backend Auth System)

---

## Epic Goal

Connect the existing frontend authentication UI (login/register forms) to the backend API, implement JWT token management, protected route handling, and authentication state management. Transform the static auth UI into a fully functional authentication system.

---

## Epic Description

### Current State

**Frontend UI Already Exists:**
- ✅ Login page at `/login` with styled form
- ✅ Register page at `/register` with styled form
- ✅ Form components using react-hook-form + Zod validation
- ❌ No API integration (forms don't submit to backend)
- ❌ No token storage or management
- ❌ No authentication state management
- ❌ No protected route handling

**Technical Stack:**
- Next.js 16 App Router
- React 19
- react-hook-form + Zod for validation
- Fetch API for HTTP requests (or install axios)
- LocalStorage for token persistence

---

### What This Epic Delivers

1. **API Integration**
   - Connect login/register forms to backend endpoints
   - Handle API success and error responses
   - Display validation errors from backend

2. **Token Management**
   - Store access_token and refresh_token in localStorage
   - Implement token refresh logic
   - Clear tokens on logout

3. **Authentication State**
   - Create AuthContext for app-wide auth state
   - Provide currentUser object to components
   - Handle loading states during auth checks

4. **Protected Routes**
   - Middleware to check authentication before rendering dashboard
   - Redirect unauthenticated users to login
   - Redirect authenticated users away from login/register

5. **User Experience**
   - Loading spinners during API calls
   - Toast notifications for success/error
   - Form validation with backend error messages
   - Auto-redirect after successful login/register

---

## Stories

### Story 1: API Client and Authentication Service

**Goal:** Create reusable API client with authentication logic.

**Key Tasks:**
- Create `frontend/lib/api-client.ts` with fetch wrapper
- Add authentication headers (Bearer token) to requests
- Create `frontend/lib/auth-service.ts` with login, register, logout functions
- Implement automatic token refresh on 401 errors
- Handle network errors gracefully

**Acceptance Criteria:**
- [ ] API client sends `Authorization: Bearer <token>` header
- [ ] Token retrieved from localStorage automatically
- [ ] 401 responses trigger token refresh attempt
- [ ] Network errors return user-friendly messages
- [ ] API client exported and reusable across app

**Implementation:**
```typescript
// frontend/lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class APIClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('access_token');

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try refresh token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry original request
        return this.request(endpoint, options);
      } else {
        // Redirect to login
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  }

  async post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem('access_token', data.data.access_token);
      return true;
    } catch {
      return false;
    }
  }
}

export const apiClient = new APIClient();
```

```typescript
// frontend/lib/auth-service.ts
import { apiClient } from './api-client';

export async function register(data: {
  email: string;
  password: string;
  name: string;
  terms_accepted: boolean;
}) {
  const response = await apiClient.post('/auth/register', data);

  // Store tokens
  localStorage.setItem('access_token', response.data.access_token);
  localStorage.setItem('refresh_token', response.data.refresh_token);

  return response.data.user;
}

export async function login(data: { email: string; password: string }) {
  const response = await apiClient.post('/auth/login', data);

  // Store tokens
  localStorage.setItem('access_token', response.data.access_token);
  localStorage.setItem('refresh_token', response.data.refresh_token);

  return response.data.user;
}

export async function logout() {
  const refreshToken = localStorage.getItem('refresh_token');

  if (refreshToken) {
    await apiClient.post('/auth/logout', { refresh_token: refreshToken });
  }

  // Clear tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me');
  return response.data.user;
}
```

---

### Story 2: Authentication Context and State Management

**Goal:** Create React Context for managing authentication state across the app.

**Key Tasks:**
- Create `frontend/contexts/auth-context.tsx`
- Provide currentUser, loading state, login/logout functions
- Check authentication status on app mount
- Persist authentication across page refreshes
- Handle authentication state updates

**Acceptance Criteria:**
- [ ] AuthContext provides: `{ user, loading, login, register, logout, isAuthenticated }`
- [ ] On mount, attempts to fetch current user if token exists
- [ ] Loading state prevents flash of wrong content
- [ ] Context updates when login/logout called
- [ ] Works across all pages via AuthProvider wrapper

**Implementation:**
```typescript
// frontend/contexts/auth-context.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser } from '@/lib/auth-service';
import type { User } from '@/shared/schemas/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; terms_accepted: boolean }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');

      if (token) {
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await apiLogin({ email, password });
    setUser(user);
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    terms_accepted: boolean;
  }) => {
    const user = await apiRegister(data);
    setUser(user);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Add to root layout:**
```typescript
// frontend/app/layout.tsx
import { AuthProvider } from '@/contexts/auth-context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

### Story 3: Connect Login and Register Forms to Backend

**Goal:** Implement form submission logic for existing login/register UI.

**Key Tasks:**
- Update `frontend/components/login-form.tsx` to call API on submit
- Update `frontend/components/register-form.tsx` to call API on submit
- Display loading state during API calls
- Show toast notifications for success/errors
- Display backend validation errors in forms
- Redirect to dashboard on success

**Acceptance Criteria:**
- [ ] Login form calls `auth.login(email, password)` on submit
- [ ] Register form calls `auth.register(data)` on submit
- [ ] Loading spinner shows during API call
- [ ] Success toast shown on successful auth
- [ ] Error toast shown for API errors
- [ ] Backend validation errors displayed under form fields
- [ ] Redirects to `/dashboard` after successful login/register
- [ ] Form disabled during submission

**Implementation:**
```typescript
// frontend/components/login-form.tsx (updated)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from '@/shared/schemas/user';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);

    try {
      await login(data.email, data.password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Existing form fields */}
      <Input {...form.register('email')} type="email" placeholder="Email" />
      {form.formState.errors.email && (
        <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
      )}

      <Input {...form.register('password')} type="password" placeholder="Password" />
      {form.formState.errors.password && (
        <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  );
}
```

---

### Story 4: Protected Route Middleware

**Goal:** Implement route protection for dashboard pages.

**Key Tasks:**
- Create middleware to check authentication before rendering dashboard
- Redirect unauthenticated users to `/login`
- Redirect authenticated users away from `/login` and `/register` to `/dashboard`
- Handle loading state gracefully (avoid flash of login page)
- Preserve intended destination URL for post-login redirect

**Acceptance Criteria:**
- [ ] Dashboard routes (`/dashboard/*`) require authentication
- [ ] Unauthenticated users redirected to `/login`
- [ ] Authenticated users redirected away from `/login` to `/dashboard`
- [ ] Intended URL preserved: login → dashboard → /notes redirects to /notes
- [ ] Loading state shows spinner (not flash of wrong page)
- [ ] Middleware runs on all protected routes

**Implementation:**
```typescript
// frontend/middleware.ts (Next.js middleware)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ['/dashboard', '/notes', '/search'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Auth routes
  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.includes(pathname);

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Alternative: Client-side protection (if middleware doesn't work with App Router):**
```typescript
// frontend/app/(dashboard)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
```

---

### Story 5: Logout Functionality and User Menu

**Goal:** Implement logout functionality in the dashboard header/user menu.

**Key Tasks:**
- Add logout button to dashboard header or user dropdown
- Call API on logout
- Clear tokens and authentication state
- Redirect to login page
- Show confirmation toast
- Handle errors gracefully

**Acceptance Criteria:**
- [ ] Logout button visible in dashboard UI
- [ ] Clicking logout calls `auth.logout()`
- [ ] Tokens cleared from localStorage
- [ ] User redirected to `/login`
- [ ] Success toast shown: "Logged out successfully"
- [ ] Error handling if API call fails (still clears local state)

**Implementation:**
```typescript
// frontend/components/dashboard/user-menu.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Logout failed');
      // Clear local state anyway
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      router.push('/login');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarFallback>
            {user?.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem disabled>
          {user?.email}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Dependencies

**Depends On:**
- ✅ Epic 2: Backend Auth System (needs working auth endpoints)

**Blocks:**
- Epic 6: Frontend Notes Logic (needs authentication to work)
- Epic 7: Frontend Search Logic (needs authentication to work)

---

## Risk Mitigation

### Primary Risks

1. **Token Storage Security**
   - Risk: XSS attacks can steal tokens from localStorage
   - Mitigation: Use httpOnly cookies if possible, sanitize all user input
   - Limitation: localStorage acceptable for MVP, upgrade later if needed

2. **Token Refresh Edge Cases**
   - Risk: Multiple failed refreshes cause infinite loops
   - Mitigation: Add refresh attempt counter, clear tokens after 3 failures
   - UX: Show clear "Session expired" message

3. **CORS Issues**
   - Risk: Browser blocks API requests due to CORS
   - Mitigation: Ensure backend CORS configured for frontend origin
   - Testing: Test from actual domain, not just localhost

---

## Definition of Done

- [ ] All 5 stories completed with acceptance criteria met
- [ ] Login form submits to backend and redirects to dashboard
- [ ] Register form submits to backend and redirects to dashboard
- [ ] AuthContext provides authentication state app-wide
- [ ] Protected routes redirect unauthenticated users
- [ ] Logout clears tokens and redirects to login
- [ ] Toast notifications show for all auth actions
- [ ] No flash of wrong content during auth checks

---

## Success Metrics

**User Experience:** Login/register completes in <3 seconds

**Reliability:** Authentication state persists across page refreshes

**Security:** Tokens cleared on logout, no sensitive data in console

---

## Notes for Developers

- **Use existing UI components** - Just wire up the logic, don't rebuild UI
- **Test token refresh** - Set short token expiry (5 min) to test refresh flow
- **Handle edge cases** - Network errors, invalid tokens, expired sessions
- **User feedback is critical** - Show loading states and error messages

---

## Handoff to Next Epic

Once Epic 5 is complete, Epic 6 (Frontend Notes Logic) can begin. Developers will have:
- ✅ Working authentication flow
- ✅ Protected routes
- ✅ Current user available in AuthContext

Epic 6 will implement CRUD operations for notes in the frontend.
