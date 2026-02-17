# Epic 7: Frontend Search Interface Logic

**Status:** Not Started
**Priority:** MEDIUM
**Estimated Duration:** 2-3 days
**Dependencies:** Epic 4 (Backend Search & MCP), Epic 5 (Frontend Auth Logic)

---

## Epic Goal

Implement the semantic search interface in the frontend, connecting the existing search UI to the backend search API. Enable users to search their knowledge base with natural language queries and view ranked results with similarity scores.

---

## Epic Description

### Current State

**Frontend UI Already Exists:**
- ✅ Search page at `/search` with search input
- ✅ Search results display area
- ✅ Markdown snippet rendering
- ❌ No API integration (no real search)
- ❌ No query submission logic
- ❌ No results display from API

**What Needs Implementation:**
- Connect search form to backend API
- Display ranked results with similarity scores
- Show matching snippets
- Implement search filters (tags, date range)
- Handle loading and empty states
- Highlight search terms in results

---

### What This Epic Delivers

1. **Search Form Integration**
   - Submit search queries to backend
   - Real-time search as user types (debounced)
   - Search history (localStorage)

2. **Results Display**
   - Show ranked results with similarity scores
   - Display matching snippets
   - Link to full notes
   - Visual similarity indicator (progress bar/badge)

3. **Search Filters**
   - Filter by tags
   - Filter by date range
   - Filter by archive status
   - Save filter preferences

4. **User Experience**
   - Loading state with skeleton
   - Empty state ("No results found")
   - Error handling
   - Keyboard shortcuts (Cmd+K for search)

---

## Stories

### Story 1: Search API Service and Hook

**Goal:** Create search service layer and React Query hook.

**Key Tasks:**
- Create `frontend/lib/search-service.ts`
- Implement `searchNotes` function
- Create `useSearch` React Query hook
- Handle query debouncing
- Cache search results

**Acceptance Criteria:**
- [ ] `searchNotes(query, filters)` calls backend `/api/v1/search`
- [ ] Returns results with similarity scores
- [ ] `useSearch` hook with proper caching
- [ ] Debounce search queries (500ms)
- [ ] Loading and error states accessible

**Implementation:**
```typescript
// frontend/lib/search-service.ts
import { apiClient } from './api-client';

export interface SearchParams {
  query: string;
  limit?: number;
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

export interface SearchResult {
  note: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    created_at: string;
  };
  similarity_score: number;
  matching_snippet: string;
}

export async function searchNotes(params: SearchParams) {
  const response = await apiClient.post('/search', params);
  return response.data;
}
```

```typescript
// frontend/lib/hooks/use-search.ts
import { useQuery } from '@tanstack/react-query';
import { searchNotes, type SearchParams } from '../search-service';
import { useDebouncedValue } from './use-debounce';

export function useSearch(params: SearchParams) {
  // Debounce query to avoid too many API calls
  const debouncedQuery = useDebouncedValue(params.query, 500);

  return useQuery({
    queryKey: ['search', { ...params, query: debouncedQuery }],
    queryFn: () => searchNotes({ ...params, query: debouncedQuery }),
    enabled: debouncedQuery.length >= 3, // Only search if query is 3+ chars
  });
}

// frontend/lib/hooks/use-debounce.ts
import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

### Story 2: Search Page Integration

**Goal:** Connect search UI to API and display results.

**Key Tasks:**
- Update `frontend/app/(dashboard)/search/page.tsx`
- Implement search form submission
- Display search results from API
- Show similarity scores
- Render matching snippets
- Link to full notes

**Acceptance Criteria:**
- [ ] Search input triggers API call (debounced)
- [ ] Results displayed in list format
- [ ] Similarity score shown as percentage or badge
- [ ] Matching snippet rendered with highlighting
- [ ] Clicking result navigates to note edit page
- [ ] Loading state shows skeleton loaders
- [ ] Empty state: "No results found for 'query'"
- [ ] Minimum 3 characters required to search

**Implementation:**
```typescript
// frontend/app/(dashboard)/search/page.tsx
'use client';

import { useState } from 'react';
import { useSearch } from '@/lib/hooks/use-search';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data, isLoading, error } = useSearch({
    query,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Search Knowledge Base</h1>

      <Input
        type="search"
        placeholder="Search your notes... (min 3 characters)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6"
        autoFocus
      />

      {/* Tag filter UI */}

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500">
          Error: {error.message}
        </div>
      )}

      {data && query.length >= 3 && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Found {data.results.length} results in {data.query_time_ms}ms
          </p>

          {data.results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">
                No results found for "{query}"
              </p>
            </div>
          )}

          <div className="space-y-4">
            {data.results.map((result) => (
              <Link key={result.note.id} href={`/notes/${result.note.id}/edit`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{result.note.title}</CardTitle>
                      <Badge variant={result.similarity_score > 0.7 ? 'default' : 'secondary'}>
                        {(result.similarity_score * 100).toFixed(0)}% match
                      </Badge>
                    </div>
                    <CardDescription>
                      {result.note.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="mr-2">
                          {tag}
                        </Badge>
                      ))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-sm text-muted-foreground line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: result.matching_snippet }}
                    />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {query.length > 0 && query.length < 3 && (
        <div className="text-center py-8 text-muted-foreground">
          Type at least 3 characters to search
        </div>
      )}
    </div>
  );
}
```

---

### Story 3: Search Filters and Advanced Options

**Goal:** Implement search filters for tags, date range, and archive status.

**Key Tasks:**
- Add tag filter dropdown/multi-select
- Add date range picker
- Add archive status toggle
- Save filter preferences to localStorage
- Update search query with filters

**Acceptance Criteria:**
- [ ] Tag filter allows selecting multiple tags
- [ ] Date range picker sets date_from and date_to
- [ ] Archive status toggle includes/excludes archived notes
- [ ] Filters persist in localStorage
- [ ] Clearing filters resets to defaults
- [ ] URL params reflect current filters (optional)

**Implementation:**
```typescript
// Search filters component
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function SearchFilters({
  onFiltersChange,
}: {
  onFiltersChange: (filters: any) => void;
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  useEffect(() => {
    // Load saved filters from localStorage
    const saved = localStorage.getItem('searchFilters');
    if (saved) {
      const filters = JSON.parse(saved);
      setSelectedTags(filters.tags || []);
      setIncludeArchived(filters.includeArchived || false);
    }
  }, []);

  useEffect(() => {
    // Save filters to localStorage
    const filters = {
      tags: selectedTags,
      dateFrom,
      dateTo,
      includeArchived,
    };
    localStorage.setItem('searchFilters', JSON.stringify(filters));

    // Notify parent
    onFiltersChange({
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      is_archived: includeArchived ? undefined : false,
    });
  }, [selectedTags, dateFrom, dateTo, includeArchived, onFiltersChange]);

  return (
    <div className="flex gap-2 mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            Filters {selectedTags.length > 0 && `(${selectedTags.length})`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <Label>Tags</Label>
              {/* Tag selection UI */}
            </div>

            <div>
              <Label>Date Range</Label>
              {/* Date picker UI */}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="archived"
                checked={includeArchived}
                onCheckedChange={(checked) => setIncludeArchived(!!checked)}
              />
              <Label htmlFor="archived">Include archived notes</Label>
            </div>

            <Button onClick={() => {
              setSelectedTags([]);
              setDateFrom('');
              setDateTo('');
              setIncludeArchived(false);
            }}>
              Clear Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

---

### Story 4: Search History and Keyboard Shortcuts

**Goal:** Add search history and global keyboard shortcut (Cmd+K).

**Key Tasks:**
- Save recent searches to localStorage
- Display search history dropdown
- Implement Cmd+K global shortcut to open search
- Create search modal/dialog (optional)
- Clear search history option

**Acceptance Criteria:**
- [ ] Recent searches saved to localStorage (max 10)
- [ ] Search history dropdown shows below input
- [ ] Cmd+K (Mac) or Ctrl+K (Windows) opens search
- [ ] Search modal accessible from anywhere in app
- [ ] Clicking history item populates search input
- [ ] Can clear individual or all history items

**Implementation:**
```typescript
// Search history hook
import { useState, useEffect } from 'react';

const MAX_HISTORY = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const addToHistory = (query: string) => {
    if (!query || query.length < 3) return;

    const updated = [query, ...history.filter(q => q !== query)].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  return { history, addToHistory, clearHistory };
}

// Global keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      // Open search modal or focus search input
      router.push('/search');
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

### Story 5: Search Results Enhancements

**Goal:** Improve search results UX with highlighting and sorting options.

**Key Tasks:**
- Highlight search terms in snippets
- Add sort options (relevance, date, title)
- Show note metadata (created date, word count)
- Add "Open in new tab" option
- Export search results (optional)

**Acceptance Criteria:**
- [ ] Search terms highlighted in yellow/accent color
- [ ] Sort dropdown: Relevance, Newest, Oldest, A-Z
- [ ] Note metadata shown below snippet
- [ ] Right-click opens context menu with "Open in new tab"
- [ ] Search results feel polished and professional

**Implementation:**
```typescript
// Highlight search terms in snippet
function highlightSearchTerms(snippet: string, query: string): string {
  const terms = query.toLowerCase().split(' ').filter(t => t.length >= 3);

  let highlighted = snippet;
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  });

  return highlighted;
}
```

---

## Dependencies

**Depends On:**
- ✅ Epic 4: Backend Search & MCP (needs search API)
- ✅ Epic 5: Frontend Auth Logic (needs authentication)

**Blocks:**
- None (Epic 8 can proceed without this)

---

## Risk Mitigation

### Primary Risks

1. **Slow Search Performance**
   - Risk: Search takes >2 seconds, feels slow
   - Mitigation: Show loading indicator immediately, cache results
   - Fallback: Display "Still searching..." message after 2s

2. **Poor Search Relevance**
   - Risk: Users can't find what they're looking for
   - Mitigation: Document search tips, suggest query improvements
   - Future: Add relevance feedback mechanism

3. **XSS from Snippet Rendering**
   - Risk: Malicious markdown in snippets could execute scripts
   - Mitigation: Use `rehype-sanitize` to sanitize HTML
   - Security: Never use `dangerouslySetInnerHTML` without sanitization

---

## Definition of Done

- [ ] All 5 stories completed with acceptance criteria met
- [ ] Search page queries backend API
- [ ] Results displayed with similarity scores
- [ ] Search filters work (tags, date range)
- [ ] Search history saved and accessible
- [ ] Cmd+K keyboard shortcut works
- [ ] Loading and empty states implemented
- [ ] Search results feel fast and responsive

---

## Success Metrics

**Performance:** Search results display in <2 seconds

**UX:** Users find relevant note in top 5 results >90% of time

**Engagement:** Search used at least once per session

---

## Notes for Developers

- **Debounce aggressively** - Don't hammer API with every keystroke
- **Cache results** - React Query handles this, but verify it works
- **Test with real data** - Create 100+ notes to test search quality
- **Search is core UX** - Make it feel fast and accurate

---

## Handoff to Next Epic

Once Epic 7 is complete, Epic 8 (Testing & Deployment) can begin. Developers will have:
- ✅ Fully functional search interface
- ✅ Complete frontend application

Epic 8 will add tests, optimize performance, and deploy to production.
