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
        onChange={e => setQuery(e.target.value)}
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
import { Search, Zap, Sparkles, Filter, Clock, Loader2, X } from 'lucide-react';
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
