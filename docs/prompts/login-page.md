# Generate Login Page with Form Validation

## High-Level Goal
Create a centered, accessible login page with email/password form, validation, error handling, and social login options. The design should be clean, professional, and optimized for both desktop and mobile devices.

## Detailed Step-by-Step Instructions

1. **Create the Login Page Component**
   - File path: `app/(auth)/login/page.tsx`
   - Make it a Client Component ('use client')
   - Use TypeScript with strict typing

2. **Build the Page Layout Structure**
   - Center the login form vertically and horizontally on the page
   - Full-height viewport (min-h-screen)
   - Split layout (optional): Left side = illustration/branding, Right side = form
   - For mobile: Single column, full width

3. **Create the Branding Section**
   - App logo/icon at top (use Lucide `Brain` icon)
   - App name: "Personal Vault"
   - Tagline: "Your personal knowledge base"
   - Optional: Decorative illustration or gradient background

4. **Build the Login Form Card**
   - Use shadcn/ui Card component with elevated shadow
   - Form heading: "Welcome back" (H1)
   - Subheading: "Sign in to your account"
   - Max width: 400px on desktop, full width on mobile
   - Padding: 32px (desktop), 24px (mobile)

5. **Implement Form Fields**
   - **Email field:**
     - Label: "Email address"
     - Input type: email
     - Placeholder: "you@example.com"
     - Icon: Mail (Lucide)
     - Validation: Required, valid email format
     - Error message: "Please enter a valid email address"
   - **Password field:**
     - Label: "Password"
     - Input type: password (with show/hide toggle)
     - Placeholder: "Enter your password"
     - Icon: Lock (Lucide)
     - Toggle icon: Eye/EyeOff (show/hide password)
     - Validation: Required, min 8 characters
     - Error message: "Password must be at least 8 characters"

6. **Add Form Actions**
   - **Remember me checkbox** (optional)
     - Checkbox + label: "Remember me for 30 days"
   - **Forgot password link**
     - Text: "Forgot password?"
     - Links to `/forgot-password` (right-aligned)
   - **Submit button**
     - Text: "Sign in"
     - Primary variant, full width
     - Loading state: Spinner + "Signing in..."
     - Disabled state when form is invalid or submitting

7. **Implement Form Validation with react-hook-form + zod**
   - Use react-hook-form for form state management
   - Use zod schema for validation rules
   - Show inline error messages below each field
   - Validate on blur and on submit
   - Disable submit button when form is invalid

8. **Add Social Login Options (Optional)**
   - Divider with text: "Or continue with"
   - Social login buttons (outline variant, icon + text):
     - Google (Google icon)
     - GitHub (GitHub icon)
   - Full width on mobile, side-by-side on desktop

9. **Add Sign Up Link**
   - Text: "Don't have an account?" + Link "Sign up"
   - Centered at bottom of card
   - Link navigates to `/register`

10. **Implement Error Handling**
    - **Form-level errors** (from API):
      - Show error alert above form: "Invalid email or password"
      - Use Alert component (destructive variant)
      - Include retry button or dismiss option
    - **Field-level errors** (validation):
      - Show inline below each field with icon
      - Red border on invalid fields
      - Aria-describedby for screen readers

11. **Add Loading and Success States**
    - Loading: Show spinner in button, disable all inputs
    - Success: Brief success message, then redirect to `/dashboard`
    - Use toast notification: "Welcome back!"

12. **Implement Responsive Design**
    - Mobile (< 768px): Full width card, stacked layout, larger touch targets
    - Tablet/Desktop: Centered card with max-width 400px, side-by-side social buttons
    - Use Tailwind breakpoints

## Code Examples, Data Structures & Constraints

### Login Form Schema:
```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
```

### Form Implementation Pattern:
```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, Brain, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError(null);
      // Simulate API call (replace with actual NextAuth signIn)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // On success:
      router.push('/dashboard');
    } catch (error) {
      setLoginError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </CardHeader>
        <CardContent>
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="rounded border-input"
                />
                <span>Remember me</span>
              </label>
              <a href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                {/* Google icon SVG */}
              </svg>
              Google
            </Button>
            <Button variant="outline" type="button">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                {/* GitHub icon SVG */}
              </svg>
              GitHub
            </Button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <a href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Required Icons (Lucide):
```typescript
import {
  Brain,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
```

### Constraints - DO NOT:
- Do NOT implement actual authentication logic (mock with setTimeout)
- Do NOT store credentials in localStorage (security risk)
- Do NOT implement real social login (show buttons only)
- Do NOT skip form validation (always validate)
- Do NOT allow submission with invalid data

## Define Strict Scope

**Files to Create:**
- `app/(auth)/login/page.tsx` (main login page)
- `app/(auth)/layout.tsx` (auth layout - centered card wrapper)

**Files NOT to Modify:**
- Do NOT alter NextAuth configuration yet
- Do NOT modify API routes
- Do NOT touch database files

**Functionality Scope:**
- ONLY build UI with mock authentication (console.log credentials)
- DO implement form validation with react-hook-form + zod
- DO show loading and error states
- DO implement password show/hide toggle
- DO NOT implement real authentication or session management

**Accessibility Requirements:**
- All form fields must have associated labels (htmlFor/id)
- Password toggle button must have aria-label
- Error messages must be associated with inputs (aria-describedby)
- Form must be keyboard navigable (Tab to navigate, Enter to submit)
- Focus indicators must be visible
- Use semantic HTML (form, label, button)

**Design Guidelines:**
- Keep the design clean and uncluttered
- Use ample whitespace for better readability
- Center the form on the page (vertical and horizontal)
- Make touch targets at least 44x44px on mobile
- Use consistent spacing (Tailwind scale)
- Ensure high contrast for text (WCAG AA minimum)

**Security Considerations:**
- Mask password input by default (type="password")
- Show password strength indicator (optional)
- Prevent form submission on Enter key if form is invalid
- Clear sensitive data on unmount (if using local state)

---

**Expected Output:**
A professional, accessible login page with email/password form, validation, social login options, and proper error handling. Clean design optimized for conversion and usability.