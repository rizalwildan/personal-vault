# Generate Notes Grid View with Interactive Note Cards

## High-Level Goal

Create a responsive notes browsing interface with list/grid view toggle, filtering, sorting, and interactive note cards. Each card should display note metadata, tags, and action buttons with hover states.

## Detailed Step-by-Step Instructions

1. **Create the Notes Page Component**
   - File path: `app/(dashboard)/notes/page.tsx`
   - Make it a Server Component for initial data loading
   - Use TypeScript with strict typing

2. **Build the Top Control Bar**
   - Create a sticky header bar (sticky top-0) with white background and subtle shadow
   - Include 4 sections (left to right):
     - View toggle buttons: List icon and Grid icon (toggle between views)
     - Filter dropdown: "Filter by tags" with multi-select
     - Sort dropdown: Options: "Title (A-Z)", "Date Modified", "Date Created"
     - Search input: "Filter notes..." (client-side filter)

3. **Implement View Toggle Logic (Client Component)**
   - Create `components/notes/notes-view.tsx` as a Client Component
   - Use `useState` to track view mode: 'list' | 'grid'
   - Store preference in localStorage: `localStorage.setItem('notesView', mode)`
   - On mount, restore preference from localStorage

4. **Build the NoteCard Component**
   - File path: `components/notes/note-card.tsx`
   - Accept props: note object, onEdit callback, onDelete callback, variant
   - Display:
     - Note title (truncate at 100 characters, use ellipsis)
     - Content preview (first 2 lines of markdown, strip formatting)
     - Tags (display as colored badges, max 5 visible, "+X more" if exceeded)
     - Last modified date (relative: "2 days ago")
     - Indexing status icon (green checkmark or yellow warning)
     - Action buttons: Edit (pencil icon) and Delete (trash icon)

5. **Card Variants and States**
   - **Default variant:** Subtle border, rounded corners (8px), padding 16px
   - **Hover state:** Lift effect with shadow increase, background color change
   - **Selected state:** Border color change to primary
   - **Keyboard focus:** Visible outline ring

6. **Implement Card Interactions**
   - Clicking anywhere on card navigates to `/notes/{id}` (view mode)
   - Edit button (stops propagation) navigates to `/notes/{id}/edit`
   - Delete button (stops propagation) opens confirmation dialog
   - Tags are clickable, filter notes by that tag
   - Make entire card keyboard accessible (Tab to focus, Enter to open)

7. **Build the Notes Grid/List Layout**
   - **Grid view:**
     - Mobile: 1 column
     - Tablet: 2 columns (gap-4)
     - Desktop: 3 columns (gap-6)
     - Wide: 4 columns (gap-6)
   - **List view:**
     - Full width cards, compact layout
     - Show more metadata (word count, created date)
   - Use CSS Grid with responsive breakpoints

8. **Add Empty State**
   - Display when no notes exist
   - Show illustration placeholder (use Lucide `FileText` icon, large and muted)
   - Primary message: "No notes yet"
   - Secondary message: "Create your first note to get started"
   - Call-to-action button: "Create Note" (links to `/notes/new`)

9. **Implement Loading State**
   - Show skeleton loaders (6-9 cards) matching the grid layout
   - Use shimmer animation effect (duration: 1.5s, ease-in-out, infinite)

10. **Add Pagination or Infinite Scroll**
    - For this mockup, show "Load More" button at the bottom
    - Button should be centered, secondary variant
    - Display count: "Showing 20 of 156 notes"

## Code Examples, Data Structures & Constraints

### Note Data Structure:

```typescript
interface Note {
  id: string;
  title: string;
  content: string; // Markdown text
  tags: { id: string; name: string; color: string }[];
  createdAt: Date;
  updatedAt: Date;
  isIndexed: boolean; // For MCP embedding status
  wordCount: number;
}

interface NoteCardProps {
  note: Note;
  onEdit: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  variant?: 'default' | 'compact';
  viewMode: 'list' | 'grid';
}
```

### Example NoteCard Implementation Pattern:

```tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function NoteCard({ note, onEdit, onDelete, viewMode }: NoteCardProps) {
  const handleCardClick = () => {
    router.push(`/notes/${note.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onEdit(note.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleCardClick}
      role="article"
      aria-label={`Note: ${note.title}`}
    >
      {/* Implementation details... */}
    </Card>
  );
}
```

### Responsive Grid Classes:

```tsx
// Grid view
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">

// List view
<div className="flex flex-col gap-3">
```

### Constraints - DO NOT:

- Do NOT implement real data fetching (use 10-15 mock notes)
- Do NOT create actual delete functionality (console.log only)
- Do NOT implement advanced tag filtering (visual mockup only)
- Do NOT add drag-and-drop or advanced interactions
- Do NOT use animations longer than 200ms (keep it snappy)

## Define Strict Scope

**Files to Create:**

- `app/(dashboard)/notes/page.tsx` (main notes page)
- `components/notes/note-card.tsx` (reusable note card)
- `components/notes/notes-grid.tsx` (grid layout container, client component)
- `components/notes/notes-controls.tsx` (filter/sort bar, client component)

**Files NOT to Modify:**

- Do NOT alter existing shadcn/ui components
- Do NOT modify routing or layout files
- Do NOT touch API routes or database files

**Functionality Scope:**

- ONLY build visual UI with mock data (10-15 notes)
- DO implement view toggle (list/grid) with state persistence
- DO implement hover and focus states
- DO use semantic HTML and ARIA labels
- DO NOT implement actual sorting, filtering, or deletion

**Accessibility Requirements:**

- Each card must be keyboard navigable (Tab to focus, Enter to activate)
- Action buttons must have aria-label attributes
- Cards must have role="article" and aria-label
- Focus indicators must be visible (ring-2 ring-primary)

**Design Guidelines:**

- Follow "Content is King" principle - let note content stand out
- Use subtle hover effects (shadow-md, slight lift)
- Maintain consistent spacing (p-4 for cards, gap-4 for grids)
- Use muted colors for metadata, bold for titles

---

**Expected Output:**
A fully responsive notes browsing interface with interactive cards, view toggle, and clean design. Ready for backend integration with TanStack Query for real data fetching.
