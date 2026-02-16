# AI Frontend Generation Prompts
**BMad-Personal-Vault (MCP Knowledge Base)**

**Document Version:** 1.0
**Last Updated:** February 16, 2026
**Status:** Ready for Use

---

## 📖 Overview

This document contains **5 production-ready AI prompts** for generating UI components for the BMad-Personal-Vault knowledge management system. Each prompt follows the **4-part Structured Prompting Framework** designed for optimal results with AI code generation tools like v0.dev, Lovable.ai, Cursor, or Windsurf.

### Framework Structure

Each prompt includes:
1. **High-Level Goal** - Clear objective summary
2. **Detailed Step-by-Step Instructions** - Sequential, actionable steps
3. **Code Examples & Constraints** - Data structures, imports, DO NOT rules
4. **Strict Scope** - File boundaries and functionality limits

### Tech Stack Context

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first configuration)
- **Components:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React
- **State Management:** TanStack Query (server state), React hooks (UI state)

---

## 🎯 How to Use These Prompts

### For v0.dev:
1. Copy the entire prompt (from "Generate..." to "Expected Output")
2. Paste into v0.dev chat interface
3. Review generated code
4. Iterate with follow-up prompts: "Adjust colors to be more muted" or "Make cards smaller on mobile"

### For Lovable.ai:
1. Create a new project or component
2. Paste the prompt in the generation input
3. Use the visual editor to tweak components
4. Export code when satisfied

### For Cursor / Windsurf:
1. Open your project
2. Use Composer/Agent mode
3. Paste the prompt
4. Agent will create files directly in your codebase

### For ChatGPT / Claude:
1. Copy the prompt
2. Paste into chat
3. Review and copy generated code
4. Paste into your IDE

---

## 📋 Prompt 1: Dashboard Home Page

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

---

## 📋 Prompt 2: All Notes View with NoteCard Component

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

---

## 📋 Prompt 3: Markdown Note Editor

# Generate Full-Featured Markdown Editor with Live Preview

## High-Level Goal
Create a split-pane markdown editor with a toolbar, live preview, keyboard shortcuts, and auto-save indicator. The editor should feel like a professional writing tool with syntax highlighting and a distraction-free design.

## Detailed Step-by-Step Instructions

1. **Create the Editor Page Component**
   - File paths:
     - `app/(dashboard)/notes/[id]/edit/page.tsx` (edit existing note)
     - `app/(dashboard)/notes/new/page.tsx` (create new note)
   - Make it a Client Component ('use client')
   - Use TypeScript

2. **Build the Editor Layout Structure**
   - Full-height viewport layout (min-h-screen minus header)
   - Three sections:
     - Top bar: Title input + action buttons
     - Main area: Split pane (editor | preview)
     - Bottom bar: Metadata panel (collapsible)

3. **Create the Title Input Section**
   - Large text input: placeholder "Untitled Note", autofocus on new notes
   - Style: text-3xl, font-bold, border-none, focus:ring-0
   - Auto-resize height as user types
   - Display character count (200 max) below input (muted color)

4. **Build the Markdown Toolbar**
   - Fixed position below title, sticky top
   - Include buttons for:
     - **Bold** (Cmd+B) - Insert `**text**`
     - **Italic** (Cmd+I) - Insert `*text*`
     - **Heading** (Cmd+H) - Insert `## `
     - **Link** (Cmd+K) - Insert `[text](url)`
     - **List** - Insert `- `
     - **Code Block** - Insert triple backticks
     - **Image** (upload) - Insert `![alt](url)`
   - Each button shows tooltip on hover with shortcut hint
   - Use Lucide icons: Bold, Italic, Heading, Link, List, Code, Image

5. **Implement the Split-Pane Editor**
   - Left pane: Markdown input (textarea)
     - Use `<textarea>` with monospace font (Fira Code or JetBrains Mono fallback)
     - Min height: 400px, auto-expand
     - Tab key inserts 2 spaces (not focus change)
     - Line numbers (optional, use CSS counter)
   - Right pane: Live preview
     - Render markdown using `react-markdown` library
     - Apply prose styling (Tailwind typography plugin)
     - Sync scroll position with left pane (advanced, optional)
   - Divider: Resizable (optional) or fixed 50/50 split
   - Toggle preview on/off with button (icon: Eye/EyeOff)

6. **Add Keyboard Shortcuts**
   - Cmd+B / Ctrl+B: Bold
   - Cmd+I / Ctrl+I: Italic
   - Cmd+K / Ctrl+K: Insert link
   - Cmd+S / Ctrl+S: Save (prevent browser default)
   - Cmd+Enter / Ctrl+Enter: Save and close
   - Escape: Cancel and go back
   - Implement using `onKeyDown` event handler

7. **Build the Bottom Metadata Panel**
   - Collapsible panel (toggle with chevron icon)
   - Show when open:
     - Tags selector (multi-select input with autocomplete)
     - Created date (read-only, muted)
     - Modified date (read-only, muted)
     - Word count (live update)
     - Indexing status badge (Indexed / Pending / Failed)
   - Padding: p-4, border-top

8. **Implement Auto-Save Indicator**
   - Display in top-right corner
   - States:
     - "Saved" (green checkmark)
     - "Saving..." (spinner)
     - "Draft saved locally" (yellow warning icon, shown when offline)
   - Auto-save every 30 seconds or 2 seconds after user stops typing (use debounce)
   - For this mockup, simulate with setTimeout and state changes

9. **Add Action Buttons (Top Bar)**
   - Left side: Back button (arrow-left icon) - goes to `/notes`
   - Right side:
     - "Cancel" button (secondary variant, discards changes with confirmation)
     - "Save" button (primary variant, Cmd+S hint)
     - "Save & Close" button (primary variant, Cmd+Enter hint)

10. **Implement Responsive Design**
    - Mobile (< 768px):
      - Stacked layout (editor on top, preview below)
      - Hide preview by default, show with toggle button
      - Full-screen mode
    - Tablet/Desktop:
      - Side-by-side split pane (50/50)
      - Toggle-able preview panel
    - Use Tailwind breakpoints: md:flex-row, md:grid-cols-2

11. **Add Loading and Error States**
    - Loading: Skeleton for toolbar and editor area
    - Error: Show error message in place of editor with retry button

## Code Examples, Data Structures & Constraints

### Note Data Structure:
```typescript
interface NoteEditorData {
  id?: string; // undefined for new notes
  title: string;
  content: string; // Markdown
  tags: { id: string; name: string; color: string }[];
  createdAt?: Date;
  updatedAt?: Date;
  wordCount: number;
  isIndexed: boolean;
}
```

### Toolbar Button Example:
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => insertMarkdown('**', '**')}
  title="Bold (Cmd+B)"
  aria-label="Bold text"
>
  <Bold className="w-4 h-4" />
</Button>
```

### Keyboard Shortcut Handler Pattern:
```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? e.metaKey : e.ctrlKey;

  if (modifier && e.key === 'b') {
    e.preventDefault();
    insertMarkdown('**', '**');
  } else if (modifier && e.key === 's') {
    e.preventDefault();
    handleSave();
  }
  // ... more shortcuts
};
```

### Markdown Preview with react-markdown:
```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

<div className="prose prose-slate dark:prose-invert max-w-none p-6">
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeSanitize]}
  >
    {content}
  </ReactMarkdown>
</div>
```

### Required Dependencies:
```json
{
  "react-markdown": "^9.0.0",
  "remark-gfm": "^4.0.0",
  "rehype-sanitize": "^6.0.0",
  "date-fns": "^3.0.0"
}
```

### Constraints - DO NOT:
- Do NOT implement actual file upload (show console.log only)
- Do NOT fetch real note data (use mock data or URL params)
- Do NOT implement real auto-save API calls (simulate with setTimeout)
- Do NOT add complex markdown extensions (code syntax highlighting, math)
- Do NOT use heavy WYSIWYG editors (CodeMirror, Monaco) - keep it simple with textarea

## Define Strict Scope

**Files to Create:**
- `app/(dashboard)/notes/[id]/edit/page.tsx` (edit note page)
- `app/(dashboard)/notes/new/page.tsx` (create new note page)
- `components/notes/markdown-editor.tsx` (editor component with toolbar)
- `components/notes/markdown-preview.tsx` (preview pane)
- `hooks/use-debounce.ts` (debounce hook for auto-save)

**Files NOT to Modify:**
- Do NOT alter shadcn/ui components
- Do NOT modify routing configuration
- Do NOT touch API routes yet (mock save function)

**Functionality Scope:**
- ONLY build UI with mock save/cancel actions (console.log)
- DO implement toolbar actions that insert markdown syntax
- DO implement keyboard shortcuts
- DO show auto-save indicator with simulated states
- DO NOT implement real file uploads or API persistence

**Accessibility Requirements:**
- Toolbar buttons must have aria-label and title attributes
- Textarea must have proper label (use sr-only class)
- Keyboard shortcuts must not conflict with browser defaults
- Focus must be visible on all interactive elements

**Design Guidelines:**
- Follow "Content is King" - editor should be distraction-free
- Use monospace font for editor (Fira Code, JetBrains Mono, Consolas)
- Use prose styles for preview (Tailwind typography)
- Keep toolbar minimal and unobtrusive (small icons, muted colors)
- Ensure fast performance (no lag when typing)

---

**Expected Output:**
A professional markdown editor with live preview, toolbar, keyboard shortcuts, and auto-save indicator. Clean design optimized for writing. Ready for API integration with TanStack Mutation for save operations.

---

## 📋 Prompt 4: Search Interface with Mode Toggle

# Generate Advanced Search Interface with Semantic/Keyword Toggle

## High-Level Goal
Create a powerful search interface with autocomplete, mode toggle (semantic vs keyword), filters, and results display with highlighting and confidence scores.

## Detailed Step-by-Step Instructions

1. **Create the Search Page Component**
   - File path: `app/(dashboard)/search/page.tsx`
   - Make it a Client Component for interactive search
   - Use TypeScript with strict types

2. **Build the Main Search Input**
   - Large, centered search bar (prominent on page)
   - Use shadcn/ui Input with search icon (Lucide `Search`)
   - Placeholder: "Search your knowledge base..."
   - Focus state: Glow effect (ring-2 ring-primary)
   - Debounce input (300ms) before triggering search

3. **Implement Search Mode Toggle**
   - Toggle buttons above search input:
     - "Text Search" (fast, exact/fuzzy match)
     - "Semantic Search" (slower, meaning-based with AI)
   - Active mode: primary color, bold
   - Inactive mode: muted color
   - Show tooltip on hover explaining difference:
     - Text: "Fast exact word matching"
     - Semantic: "AI-powered meaning search"
   - Use segmented control component or button group

4. **Build the Filters Panel**
   - Positioned below search input, collapsible
   - Filters:
     - Date range picker (Last 7 days, Last 30 days, Last year, Custom)
     - Tag multi-select (checkboxes with tag colors)
     - Sort by: Relevance, Date (newest), Date (oldest), Title (A-Z)
   - Apply/Clear buttons at bottom
   - On mobile: Filters in a modal/drawer
   - Show active filter count badge on collapse button

5. **Implement Autocomplete Suggestions**
   - Dropdown appears below input as user types (after 2+ characters)
   - Show:
     - Top 5 matching note titles (with highlighting)
     - Recent searches (max 3, with clock icon)
     - Suggested queries (based on tags or common searches)
   - Use keyboard navigation: ArrowDown/Up to navigate, Enter to select
   - Close on Escape or click outside
   - Highlight matching text in suggestions (bold or background color)

6. **Build the Search Results List**
   - Display results as cards in vertical list
   - Each result card shows:
     - Note title (clickable to `/notes/{id}`)
     - Content excerpt (2-3 lines, with search term highlighting in yellow)
     - Tags (as badges)
     - Last modified date (relative)
     - Relevance score (for semantic search only, as percentage or stars)
   - Hover state: Subtle background color change
   - Loading state: Skeleton cards (5-6 items)

7. **Implement Search Result Highlighting**
   - Highlight search terms in title and excerpt
   - Use `<mark>` tag or span with yellow background
   - Case-insensitive matching
   - Show match count per result: "3 matches"

8. **Add Empty States**
   - **No Results:** "No notes found for '[query]'"
     - Suggestions: "Try different keywords", "Use semantic search", "Check spelling"
   - **Initial State (before search):** "Start typing to search your notes"
     - Show recent searches if available
   - **Search Error:** "Search failed. Please try again."
     - Show retry button

9. **Implement Loading Indicator**
   - For text search: Small spinner in search input (right side)
   - For semantic search: Progress bar below input (semantic searches can be slow)
   - Show loading duration: "Searching... 1.2s"
   - Allow cancellation with "Cancel" button

10. **Add Results Metadata**
    - Display above results list:
      - Total count: "Found 42 results in 0.3s"
      - Active filters summary: "Filtered by: #code, #python"
    - Pagination or "Load More" at bottom

11. **Implement Responsive Design**
    - Mobile: Stacked layout, filters in modal
    - Tablet/Desktop: Inline filters, wider search input
    - Use breakpoints: md:w-2/3, lg:w-1/2 for search input

## Code Examples, Data Structures & Constraints

### Search Data Structures:
```typescript
interface SearchResult {
  noteId: string;
  title: string;
  excerpt: string; // First 200 chars of content
  tags: { id: string; name: string; color: string }[];
  updatedAt: Date;
  relevanceScore?: number; // 0-100, only for semantic search
  matchCount: number;
}

interface SearchFilters {
  mode: 'text' | 'semantic';
  dateRange?: 'week' | 'month' | 'year' | { start: Date; end: Date };
  tags: string[];
  sortBy: 'relevance' | 'date-desc' | 'date-asc' | 'title';
}
```

### Search Input with Debounce:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search your knowledge base..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10 h-12 text-lg"
      />
      {isSearching && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
      )}
    </div>
  );
}
```

### Text Highlighting Function:
```typescript
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
```

### Mode Toggle Component:
```tsx
<div className="flex items-center gap-2 mb-4">
  <Button
    variant={mode === 'text' ? 'default' : 'ghost'}
    onClick={() => setMode('text')}
    className="flex-1"
  >
    <Zap className="w-4 h-4 mr-2" />
    Text Search
  </Button>
  <Button
    variant={mode === 'semantic' ? 'default' : 'ghost'}
    onClick={() => setMode('semantic')}
    className="flex-1"
  >
    <Sparkles className="w-4 h-4 mr-2" />
    Semantic Search
  </Button>
</div>
```

### Required Icons (Lucide):
```typescript
import {
  Search,
  Zap,
  Sparkles,
  Filter,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
```

### Constraints - DO NOT:
- Do NOT implement actual search API calls (mock search results)
- Do NOT implement real semantic search algorithm (simulate delay + mock results)
- Do NOT add complex filter logic (UI only)
- Do NOT use external search libraries (Algolia, Elasticsearch)
- Do NOT implement pagination (just show "Load More" button)

## Define Strict Scope

**Files to Create:**
- `app/(dashboard)/search/page.tsx` (main search page)
- `components/search/search-bar.tsx` (input with autocomplete)
- `components/search/search-results.tsx` (results list)
- `components/search/search-filters.tsx` (filters panel)
- `components/search/mode-toggle.tsx` (text vs semantic toggle)

**Files NOT to Modify:**
- Do NOT alter shadcn/ui components
- Do NOT modify API routes (no backend yet)
- Do NOT touch database files

**Functionality Scope:**
- ONLY build UI with mock search results (10-15 results)
- DO implement debounced search input
- DO implement text highlighting in results
- DO implement mode toggle (just UI state)
- DO NOT implement real search algorithms or API calls

**Accessibility Requirements:**
- Search input must have aria-label="Search notes"
- Autocomplete dropdown must use role="listbox" and role="option"
- Keyboard navigation: ArrowDown/Up for suggestions, Enter to select
- Loading states must announce to screen readers (aria-live="polite")
- Focus indicators visible on all interactive elements

**Design Guidelines:**
- Make search input prominent (large, centered)
- Use yellow background for highlighting matches (accessible contrast)
- Show loading indicators for slow semantic search
- Keep filters collapsible to avoid cluttering the interface
- Use muted colors for metadata, bold for titles

---

**Expected Output:**
A powerful search interface with mode toggle, autocomplete, highlighting, and filters. Clean, fast, and ready for backend integration with semantic search API.

---

## 📋 Prompt 5: Settings Page with Tabs

# Generate Settings Page with Multi-Tab Interface

## High-Level Goal
Create a comprehensive settings page with tab navigation for Connection Settings, Import/Export, Advanced options, and About information. Include form inputs, status indicators, and danger zone actions.

## Detailed Step-by-Step Instructions

1. **Create the Settings Page Component**
   - File path: `app/(dashboard)/settings/page.tsx`
   - Make it a Client Component for interactive tabs and forms
   - Use TypeScript

2. **Build the Page Header**
   - Page title: "Settings" (text-3xl, font-bold)
   - Subtitle: "Manage your Personal Vault configuration"
   - Use semantic heading structure (h1 for title)

3. **Implement Tab Navigation**
   - Use shadcn/ui Tabs component
   - Tabs: "Connection", "Import/Export", "Advanced", "About"
   - Tab indicators: Underline for active tab (primary color)
   - Keyboard navigable: Arrow keys to switch tabs

4. **Build Connection Settings Tab**
   - Section: MCP Server Configuration
     - Label: "MCP Server URL"
     - Input field: text type, placeholder "http://localhost:8000"
     - Help text: "URL where your MCP server is running"
   - Section: API Authentication
     - Label: "API Key"
     - Input field: password type (masked), placeholder "Enter your API key"
     - Toggle button: Show/Hide password (Eye icon)
   - Section: Connection Status
     - Status indicator (Badge): "Connected" (green) or "Disconnected" (red)
     - Last checked timestamp: "Last checked: 2 minutes ago"
     - Button: "Test Connection" (secondary variant)
     - On click: Show loading spinner, then success/error message

5. **Build Import/Export Tab**
   - Section: Import Notes
     - Button: "Import from Directory" (primary variant, Upload icon)
     - Help text: "Import markdown files from a local folder"
     - Display: Last import date and count (if available)
   - Section: Export Notes
     - Button: "Export All Notes" (secondary variant, Download icon)
     - Format dropdown: "Markdown (.md)", "JSON (.json)", "ZIP archive"
     - Help text: "Download all your notes"
   - Section: Manual Re-indexing
     - Button: "Re-index All Notes" (secondary variant, RefreshCw icon)
     - Help text: "Regenerate vector embeddings for semantic search"
     - Display: Last indexed timestamp
     - Warning: "This may take a few minutes for large collections"

6. **Build Advanced Tab**
   - Section: Embedding Model
     - Dropdown: "paraphrase-multilingual-MiniLM-L12-v2" (selected), other options
     - Help text: "Model used for semantic search"
   - Section: Performance Settings
     - Number input: "Batch Size" (default: 10, range: 1-100)
     - Number input: "Cache Size (MB)" (default: 100, range: 10-1000)
     - Help text for each field
   - Section: Danger Zone (red border, red text)
     - Heading: "Danger Zone" (text-destructive, font-bold)
     - Button: "Clear All Data" (destructive variant)
       - Shows confirmation dialog: "Are you sure? This cannot be undone."
     - Button: "Reset to Defaults" (destructive variant, outline)

7. **Build About Tab**
   - Display:
     - App name: "Personal Vault"
     - Version: "v1.0.0"
     - Description: "Self-hosted knowledge management system with MCP integration"
   - Links (as buttons or links):
     - "Documentation" (opens docs in new tab)
     - "GitHub Repository" (opens GitHub in new tab)
     - "Report an Issue" (opens GitHub issues)
   - Credits section:
     - List of technologies used (Next.js, PostgreSQL, pgvector, etc.)
   - License: "MIT License"

8. **Implement Form Handling**
   - Use react-hook-form for form state
   - Validate inputs (required, URL format, etc.)
   - Show inline error messages below invalid fields
   - Auto-save changes 2 seconds after user stops typing (debounced)
   - Show save indicator: "Saved" (checkmark) or "Saving..." (spinner)

9. **Add Confirmation Dialogs**
   - For "Clear All Data" button: Show modal with title, description, Confirm/Cancel buttons
   - For "Test Connection" success: Show success toast notification
   - For "Test Connection" error: Show error toast with error message

10. **Implement Responsive Design**
    - Mobile: Tabs in dropdown/select instead of horizontal tabs
    - Tablet/Desktop: Horizontal tabs, wider form inputs
    - Use form grid: 1 column mobile, 2 columns desktop (for some fields)

11. **Add Loading and Empty States**
    - Loading: Skeleton for form fields while fetching settings
    - Empty state for Import/Export: "No imports yet" if user hasn't imported files

## Code Examples, Data Structures & Constraints

### Settings Data Structure:
```typescript
interface Settings {
  mcpServerUrl: string;
  apiKey: string;
  connectionStatus: 'connected' | 'disconnected';
  lastChecked: Date;
  embeddingModel: string;
  batchSize: number;
  cacheSizeMb: number;
  lastImport?: { date: Date; count: number };
  lastIndexed?: Date;
}
```

### Tab Component Example:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="connection" className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="connection">Connection</TabsTrigger>
    <TabsTrigger value="import-export">Import/Export</TabsTrigger>
    <TabsTrigger value="advanced">Advanced</TabsTrigger>
    <TabsTrigger value="about">About</TabsTrigger>
  </TabsList>

  <TabsContent value="connection">
    {/* Connection settings form */}
  </TabsContent>

  <TabsContent value="import-export">
    {/* Import/Export options */}
  </TabsContent>

  {/* ... other tabs */}
</Tabs>
```

### Form Field Example:
```tsx
<div className="space-y-2">
  <label htmlFor="mcp-url" className="text-sm font-medium">
    MCP Server URL
  </label>
  <input
    id="mcp-url"
    type="text"
    placeholder="http://localhost:8000"
    className="w-full px-3 py-2 border rounded-md"
    {...register('mcpServerUrl', {
      required: 'URL is required',
      pattern: {
        value: /^https?:\/\/.+/,
        message: 'Must be a valid URL',
      },
    })}
  />
  {errors.mcpServerUrl && (
    <p className="text-sm text-destructive">{errors.mcpServerUrl.message}</p>
  )}
  <p className="text-sm text-muted-foreground">
    URL where your MCP server is running
  </p>
</div>
```

### Danger Zone Section:
```tsx
<div className="border-2 border-destructive rounded-lg p-6 mt-8">
  <h3 className="text-lg font-bold text-destructive mb-4">Danger Zone</h3>
  <p className="text-sm text-muted-foreground mb-4">
    These actions cannot be undone. Please be careful.
  </p>
  <div className="flex flex-col gap-3">
    <Button
      variant="destructive"
      onClick={() => setShowClearDialog(true)}
    >
      <Trash2 className="w-4 h-4 mr-2" />
      Clear All Data
    </Button>
    <Button
      variant="outline"
      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      Reset to Defaults
    </Button>
  </div>
</div>
```

### Required Icons:
```typescript
import {
  Settings,
  Key,
  Upload,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  ExternalLink,
  CheckCircle,
  XCircle,
} from 'lucide-react';
```

### Constraints - DO NOT:
- Do NOT implement real API calls for saving settings (mock with console.log)
- Do NOT implement actual import/export functionality (show file picker only)
- Do NOT connect to real MCP server (simulate test connection with timeout)
- Do NOT implement actual "Clear All Data" (just show confirmation dialog)
- Do NOT use complex form libraries beyond react-hook-form

## Define Strict Scope

**Files to Create:**
- `app/(dashboard)/settings/page.tsx` (main settings page with tabs)
- `components/settings/connection-settings.tsx` (Connection tab content)
- `components/settings/import-export-settings.tsx` (Import/Export tab)
- `components/settings/advanced-settings.tsx` (Advanced tab)
- `components/settings/about-section.tsx` (About tab)

**Files NOT to Modify:**
- Do NOT alter shadcn/ui components
- Do NOT modify API routes (no backend yet)
- Do NOT touch database or authentication files

**Functionality Scope:**
- ONLY build UI with mock save actions (console.log or local state)
- DO implement form validation with react-hook-form
- DO implement tab navigation with keyboard support
- DO show confirmation dialogs for dangerous actions
- DO NOT implement real import/export, API saving, or MCP connection

**Accessibility Requirements:**
- All form fields must have associated labels (htmlFor/id)
- Tab navigation must support Arrow keys and Tab key
- Buttons must have aria-label for icon-only buttons
- Error messages must be associated with inputs (aria-describedby)
- Danger zone actions must have explicit confirmation steps

**Design Guidelines:**
- Use clear visual hierarchy (headings, spacing)
- Group related settings in sections with borders/backgrounds
- Use help text liberally to explain settings
- Make danger zone visually distinct (red border, warning colors)
- Auto-save settings seamlessly (no Save button except for danger actions)

---

**Expected Output:**
A comprehensive settings page with tabbed interface, form validation, status indicators, and danger zone. Clean, organized, and ready for backend API integration.

---

## ⚠️ IMPORTANT REMINDERS

### Before Using AI-Generated Code

**All AI-generated code requires careful human review, testing, and refinement to be production-ready.**

You MUST:

✅ **Security Review**
- Review all generated code for security vulnerabilities
- Check for XSS, SQL injection, command injection risks
- Validate all user inputs properly
- Sanitize markdown rendering (use rehype-sanitize)

✅ **Accessibility Audit**
- Test with screen readers (VoiceOver, NVDA, JAWS)
- Verify keyboard navigation works (Tab, Enter, Escape, Arrows)
- Check color contrast meets WCAG 2.1 Level AA (4.5:1 minimum)
- Ensure focus indicators are visible

✅ **Type Safety**
- Verify TypeScript types match your actual API contracts
- Add proper error handling for all async operations
- Use strict TypeScript configuration

✅ **Testing**
- Run automated tests (Vitest for unit tests, Playwright for E2E)
- Run accessibility tests (jest-axe, axe DevTools)
- Test on real devices (mobile, tablet, desktop)
- Test with different browsers (Chrome, Firefox, Safari, Edge)

✅ **Performance Validation**
- Run Lighthouse audits (target 90+ scores)
- Analyze bundle size with `@next/bundle-analyzer`
- Test on 3G network connection
- Measure Core Web Vitals (LCP, FID, CLS)

✅ **Code Quality**
- Review for consistent naming conventions
- Ensure components follow your architecture patterns
- Check for proper error boundaries
- Verify proper use of Server vs Client Components

### AI Limitations

Remember that AI tools:
- May generate outdated patterns or deprecated APIs
- Can hallucinate non-existent library functions
- Don't understand your full application context
- May not follow your specific coding standards

**YOU are the architect and final reviewer. AI is a powerful assistant, but you own the quality.**

---

## 🎨 Customization Tips

### Adjusting the Output

Use follow-up prompts to refine generated code:

**Visual Adjustments:**
- "Make the color scheme more muted with less saturation"
- "Increase spacing between cards to 24px"
- "Use a sans-serif font instead of monospace for the editor"

**Functionality Changes:**
- "Add a loading skeleton while data is fetching"
- "Change the grid to show 2 columns on tablet instead of 3"
- "Add a confirmation dialog before deleting"

**Accessibility Improvements:**
- "Add aria-label to all icon-only buttons"
- "Ensure the modal traps keyboard focus"
- "Increase the color contrast for better readability"

**Component Simplification:**
- "Remove the preview pane and show only the editor"
- "Simplify the toolbar to just bold, italic, and link"
- "Remove animations entirely for faster performance"

---

## 📚 Additional Resources

### Design Tools
- **v0.dev** - https://v0.dev
- **Lovable.ai** - https://lovable.ai
- **shadcn/ui** - https://ui.shadcn.com
- **Tailwind CSS** - https://tailwindcss.com
- **Lucide Icons** - https://lucide.dev

### Documentation
- **Next.js 15** - https://nextjs.org/docs
- **React Server Components** - https://react.dev/reference/rsc/server-components
- **TanStack Query** - https://tanstack.com/query/latest
- **React Hook Form** - https://react-hook-form.com
- **WCAG 2.1** - https://www.w3.org/WAI/WCAG21/quickref/

### Testing Tools
- **Vitest** - https://vitest.dev
- **Playwright** - https://playwright.dev
- **jest-axe** - https://github.com/nickcolley/jest-axe
- **axe DevTools** - https://www.deque.com/axe/devtools/

---

## 📋 Prompt 6: Login Page

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

---

## 📋 Prompt 7: Register Page

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
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
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
function calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
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
        <span className={`font-medium ${strength === 'strong' ? 'text-green-600' : strength === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
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

---

## 🎯 Updated Prompt Summary

You now have **7 complete AI frontend generation prompts:**

1. ✅ Dashboard Home Page
2. ✅ All Notes View with NoteCard
3. ✅ Markdown Editor
4. ✅ Search Interface
5. ✅ Settings Page
6. ✅ **NEW: Login Page** 🔐
7. ✅ **NEW: Register Page** 🔐

All prompts follow the same 4-part structured framework for consistent, high-quality AI-generated code!

---

**Happy Building! 🎨✨**

*Generated by Sally, UX Expert for BMad-Personal-Vault*
*Powered by BMAD™ Core*
