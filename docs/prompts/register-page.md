# Generate Registration Page with Multi-Step Form

## High-Level Goal

Create a user registration page with comprehensive form validation, password strength indicator, terms acceptance, and optional email verification. The design should guide users through the signup process with clear feedback and validation.

## Detailed Step-by-Step Instructions

1. **Create the Register Page Component**
   - File path: `app/(auth)/register/page.tsx`
   - Make it a Client Component ('use client')
   - Use TypeScript with strict typing

2. **Build the Page Layout Structure**
   - Center the registration form vertically and horizontally
   - Full-height viewport (min-h-screen)
   - Similar layout to login page for consistency
   - Max width: 480px (wider than login for more fields)

3. **Create the Branding Section**
   - App logo/icon at top (use Lucide `Brain` icon)
   - Heading: "Create your account"
   - Subheading: "Start building your personal knowledge base"

4. **Build the Registration Form Card**
   - Use shadcn/ui Card component
   - Elevated shadow for depth
   - Padding: 32px (desktop), 24px (mobile)

5. **Implement Form Fields**
   - **Full Name field:**
     - Label: "Full name"
     - Input type: text
     - Placeholder: "John Doe"
     - Icon: User (Lucide)
     - Validation: Required, min 2 characters
     - Error: "Please enter your full name"

   - **Email field:**
     - Label: "Email address"
     - Input type: email
     - Placeholder: "you@example.com"
     - Icon: Mail (Lucide)
     - Validation: Required, valid email format, check if email already exists
     - Error: "Please enter a valid email" or "Email already registered"

   - **Password field:**
     - Label: "Password"
     - Input type: password (with show/hide toggle)
     - Placeholder: "Create a strong password"
     - Icon: Lock (Lucide)
     - Toggle: Eye/EyeOff
     - Validation: Required, min 8 chars, must include uppercase, lowercase, number, special char
     - Password strength indicator (visual bar: weak/medium/strong)
     - Error: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"

   - **Confirm Password field:**
     - Label: "Confirm password"
     - Input type: password
     - Placeholder: "Re-enter your password"
     - Icon: Lock (Lucide)
     - Validation: Required, must match password field
     - Error: "Passwords do not match"

6. **Add Password Strength Indicator**
   - Visual progress bar below password field
   - Colors:
     - Red: Weak (< 8 chars or missing requirements)
     - Yellow: Medium (8+ chars, 2-3 requirements met)
     - Green: Strong (8+ chars, all requirements met)
   - Text label: "Weak", "Medium", "Strong"
   - List requirements:
     - ✓ At least 8 characters
     - ✓ One uppercase letter
     - ✓ One lowercase letter
     - ✓ One number
     - ✓ One special character

7. **Add Terms and Privacy Acceptance**
   - Checkbox (required):
     - Label: "I agree to the Terms of Service and Privacy Policy"
     - Links to `/terms` and `/privacy` (open in new tab)
   - Validation: Must be checked to submit
   - Error: "You must agree to the terms to continue"

8. **Add Newsletter Opt-in (Optional)**
   - Checkbox (optional):
     - Label: "Send me product updates and tips"
     - Default: unchecked

9. **Implement Submit Button**
   - Text: "Create account"
   - Primary variant, full width
   - Loading state: Spinner + "Creating account..."
   - Disabled when form is invalid or submitting

10. **Add Social Registration Options (Optional)**
    - Divider: "Or sign up with"
    - Social buttons (same as login):
      - Google
      - GitHub
    - Note: "By signing up with Google/GitHub, you agree to our Terms and Privacy Policy"

11. **Add Login Link**
    - Text: "Already have an account?" + Link "Sign in"
    - Centered at bottom
    - Links to `/login`

12. **Implement Form Validation with react-hook-form + zod**
    - Complex validation schema with custom validators
    - Password strength validation
    - Password match validation
    - Real-time validation (validate on change for password strength)
    - Form-level validation on submit

13. **Add Success State**
    - After successful registration:
      - Show success message: "Account created successfully!"
      - Option 1: Redirect to dashboard
      - Option 2: Show "Verify your email" screen with instructions
    - Use toast notification

14. **Implement Error Handling**
    - Field-level errors: Inline below each field
    - Form-level errors: Alert at top (e.g., "Email already exists")
    - Network errors: "Registration failed. Please try again."
    - Validation errors: Real-time feedback as user types

15. **Implement Responsive Design**
    - Mobile: Full width, stacked fields, larger touch targets
    - Desktop: Centered card with max-width 480px
    - Adjust padding and spacing for mobile

## Code Examples, Data Structures & Constraints

### Registration Form Schema:

```typescript
import { z } from 'zod';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: 'You must agree to the terms to continue',
    }),
    newsletter: z.boolean().optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;
```

### Password Strength Calculator:

```typescript
function calculatePasswordStrength(
  password: string
): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak';

  let strength = 0;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 2) return 'weak';
  if (strength === 3) return 'medium';
  return 'strong';
}
```

### Password Strength Indicator Component:

```tsx
function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = calculatePasswordStrength(password);

  const strengthConfig = {
    weak: { color: 'bg-red-500', text: 'Weak', width: 'w-1/3' },
    medium: { color: 'bg-yellow-500', text: 'Medium', width: 'w-2/3' },
    strong: { color: 'bg-green-500', text: 'Strong', width: 'w-full' },
  };

  const config = strengthConfig[strength];

  return (
    <div className="space-y-2">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${config.color} transition-all duration-300 ${config.width}`}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength:</span>
        <span
          className={`font-medium ${strength === 'strong' ? 'text-green-600' : strength === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}
        >
          {config.text}
        </span>
      </div>
      <ul className="text-xs space-y-1 text-muted-foreground">
        <li className={password.length >= 8 ? 'text-green-600' : ''}>
          {password.length >= 8 ? '✓' : '○'} At least 8 characters
        </li>
        <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
          {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
        </li>
        <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
          {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
        </li>
        <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
          {/[0-9]/.test(password) ? '✓' : '○'} One number
        </li>
        <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}>
          {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} One special character
        </li>
      </ul>
    </div>
  );
}
```

### Required Icons (Lucide):

```typescript
import {
  Brain,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
```

### Constraints - DO NOT:

- Do NOT implement actual user registration API (mock with setTimeout)
- Do NOT store passwords in plain text (this is a UI mockup)
- Do NOT skip password strength validation
- Do NOT allow weak passwords
- Do NOT implement real email verification (show UI only)

## Define Strict Scope

**Files to Create:**

- `app/(auth)/register/page.tsx` (main registration page)
- `components/auth/password-strength-indicator.tsx` (reusable component)

**Files NOT to Modify:**

- Do NOT alter NextAuth configuration
- Do NOT modify API routes or database
- Do NOT touch email service configuration

**Functionality Scope:**

- ONLY build UI with mock registration (console.log form data)
- DO implement comprehensive form validation
- DO implement password strength indicator
- DO show real-time validation feedback
- DO NOT implement actual user creation or email sending

**Accessibility Requirements:**

- All form fields must have labels
- Password requirements must be announced to screen readers
- Checkbox labels must be clickable
- Terms links must open in new tab with rel="noopener noreferrer"
- Error messages must be associated with fields (aria-describedby)
- Form must be fully keyboard navigable

**Design Guidelines:**

- Make the form feel progressive (guide users step by step)
- Show validation feedback in real-time (as user types)
- Use green checkmarks for met requirements (positive reinforcement)
- Keep the design consistent with login page
- Use clear, helpful error messages
- Ensure adequate spacing between form fields

**Security Considerations:**

- Enforce strong password requirements
- Mask password fields by default
- Show password strength feedback
- Confirm password to prevent typos
- Require terms acceptance
- Do not expose whether email is already registered (in production)

---

**Expected Output:**
A comprehensive registration page with multi-field form, password strength indicator, real-time validation, terms acceptance, and proper error handling. Professional design that guides users through account creation with clear feedback.
