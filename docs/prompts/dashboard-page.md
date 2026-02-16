# Generate Dashboard Home Page for Personal Vault Knowledge Base

## High-Level Goal

Create a responsive dashboard home page for a developer-focused knowledge management system. The page should provide at-a-glance system status, quick access to create notes, and display recent activity with a clean, minimalist design.

## Detailed Step-by-Step Instructions

1. **Create the Dashboard Layout Structure**
   - Use Next.js 15 App Router with Server Components where possible
   - File path: `app/(dashboard)/dashboard/page.tsx`
   - Import shadcn/ui components: Card, Button, Badge
   - Use Tailwind v4 with CSS variables from globals.css

2. **Build the Header Section**
   - Display app title "Personal Vault" with a logo placeholder (use Lucide `Brain` icon)
   - Add system status indicator showing MCP connection health (use Badge with colors: green=healthy, yellow=warning, red=error)
   - Include user settings icon (gear/cog) linked to /settings

3. **Create Quick Actions Card**
   - Large primary button: "New Note" (Cmd+N shortcut hint below)
   - Secondary button: "Import Files"
   - Use shadcn/ui Button with variants: primary and secondary
   - Center-align in a Card component with elevated shadow

4. **Build Recent Notes Widget**
   - Display 5 most recently edited notes in a vertical list
   - Each item shows: title (truncate at 50 chars), last modified timestamp (relative, e.g., "2 hours ago")
   - Make items clickable, navigate to `/notes/{id}` on click
   - Use hover effect: subtle background color change
   - If no notes exist, show empty state: "No notes yet. Create your first note!"

5. **Create System Status Panel**
   - Display 4 stat cards in a 2x2 grid (mobile: stacked, desktop: grid)
   - Stats to show:
     - MCP Server Status (green dot + "Connected" or red dot + "Disconnected")
     - Total Notes Count (number with "notes" label)
     - Last Sync Time (relative timestamp)
     - Database Health (percentage with progress bar using green color)
   - Use Card components with compact padding

6. **Add Prominent Search Bar**
   - Full-width search input with placeholder: "Search notes... (Cmd+K)"
   - Use shadcn/ui Input with search icon (Lucide `Search`)
   - Include subtle hint text below: "Press Cmd+K or / to search from anywhere"
   - Non-functional for this mockup (focus on UI only)

7. **Implement Responsive Design**
   - Mobile (< 640px): Single column, stacked layout, full-width components
   - Tablet (640-1024px): 2-column grid for stats, single column for everything else
   - Desktop (> 1024px): Show stats in 2x2 grid, constrain max-width to 1200px

8. **Add Loading State**
   - Create a skeleton loading version using shimmer effect
   - Use it for server-side data fetching with Suspense boundary

## Code Examples, Data Structures & Constraints

### Tech Stack Context

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (use CSS variables like `var(--primary)`, `var(--background)`)
- **Components:** shadcn/ui (Button, Card, CardHeader, CardTitle, CardContent, Badge, Input)
- **Icons:** Lucide React

### Example Data Structure (for mock data):

```typescript
interface Note {
  id: string;
  title: string;
  updatedAt: Date;
}

interface DashboardData {
  recentNotes: Note[];
  stats: {
    mcpStatus: 'connected' | 'disconnected';
    totalNotes: number;
    lastSync: Date;
    dbHealth: number; // 0-100 percentage
  };
}
```

### Color Palette (use CSS variables):

```tsx
// Primary actions
className="bg-primary text-primary-foreground hover:bg-primary/90"

// Secondary actions
className="border border-input bg-background hover:bg-accent"

// Status colors
<Badge variant={status === 'connected' ? 'default' : 'destructive'}>
```

### Required Imports:

```typescript
import { Brain, Search, Plus, Upload, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
```

### Constraints - DO NOT:

- Do NOT add navigation sidebar (handled by layout component)
- Do NOT implement actual search functionality (UI mockup only)
- Do NOT fetch real data (use placeholder/mock data)
- Do NOT add complex animations (simple transitions only: 150ms ease-in-out)
- Do NOT use external libraries beyond specified tech stack

## Define Strict Scope

**Files to Create:**

- `app/(dashboard)/dashboard/page.tsx` (main dashboard page)
- `components/dashboard/stats-card.tsx` (reusable stat display component)
- `components/dashboard/recent-notes.tsx` (recent notes widget)

**Files NOT to Modify:**

- Do NOT alter `app/layout.tsx` or any existing layout files
- Do NOT modify `components/ui/*` shadcn components
- Do NOT change routing configuration
- Do NOT touch authentication or middleware files

**Functionality Scope:**

- ONLY build the visual UI with mock data
- DO implement hover states and responsive breakpoints
- DO use semantic HTML for accessibility (nav, main, section, article)
- DO include ARIA labels for icon-only buttons
- DO NOT implement data fetching, mutations, or API calls

**Design Guidelines:**

- Follow "Speed Over Features" principle - keep it fast and simple
- Use "Developer-First" aesthetic - clean, minimal, professional
- Ensure mobile-first responsive design with Tailwind breakpoints
- Match the color scheme defined in CSS variables (primary: blue, success: green, error: red)

**Keyboard Navigation:**

- Ensure all interactive elements are keyboard accessible (Tab navigation)
- Add visible focus indicators (outline ring)

---

**Expected Output:**
A fully responsive dashboard home page with clean, developer-friendly aesthetics, using shadcn/ui components, Tailwind v4 styling, and TypeScript. The page should be production-ready for visual review, pending backend integration.
