# Epic 6: Frontend Notes Management Logic

**Status:** Not Started
**Priority:** HIGH (Core Feature)
**Estimated Duration:** 4-6 days
**Dependencies:** Epic 3 (Backend Notes CRUD), Epic 5 (Frontend Auth Logic)

---

## Epic Goal

Implement complete CRUD functionality for notes in the frontend, connecting the existing UI to the backend API. Enable users to create, view, edit, delete, and organize notes with tags, while displaying embedding generation status and providing a smooth user experience.

---

## Epic Description

### Current State

**Frontend UI Already Exists:**
- ✅ Dashboard page showing notes list
- ✅ All Notes page with grid/list view
- ✅ Note editor page (`/notes/new` and `/notes/[id]/edit`)
- ✅ Markdown rendering with react-markdown
- ❌ No API integration (static/mock data)
- ❌ No form submission logic
- ❌ No state management for notes
- ❌ No real-time updates

**What Needs Implementation:**
- API calls for CRUD operations
- State management for notes list
- Form submission and validation
- Loading states and optimistic updates
- Error handling and user feedback
- Tag management UI integration
- Embedding status display

---

### What This Epic Delivers

1. **Notes List Management**
   - Fetch and display user's notes from API
   - Pagination for large note collections
   - Filter by tags and archive status
   - Sort by date created/updated

2. **Note Creation**
   - Create new note form submission
   - Real-time markdown preview
   - Tag selection/creation
   - Auto-save drafts (optional)

3. **Note Viewing and Editing**
   - Fetch single note by ID
   - Edit existing note
   - Display embedding status (pending/completed/failed)
   - Update tags

4. **Note Deletion**
   - Soft delete (archive) notes
   - Confirmation dialog
   - Optimistic UI updates

5. **Tag Management**
   - Display tags with colors
   - Create new tags inline
   - Filter notes by tags
   - Delete unused tags

---

## Stories

### Story 1: Notes API Service and State Management

**Goal:** Create API service layer for notes and implement state management.

**Key Tasks:**
- Create `frontend/lib/notes-service.ts` with CRUD functions
- Install and configure state management (React Query or Zustand)
- Implement caching and optimistic updates
- Create custom hooks: `useNotes`, `useNote`, `useCreateNote`, etc.
- Handle loading and error states

**Acceptance Criteria:**
- [ ] Notes service exports: `fetchNotes`, `createNote`, `updateNote`, `deleteNote`
- [ ] React Query configured with proper caching strategy
- [ ] `useNotes` hook fetches and caches notes list
- [ ] `useNote(id)` hook fetches single note
- [ ] Mutations invalidate cache automatically
- [ ] Loading and error states accessible in components

**Implementation:**
```typescript
// frontend/lib/notes-service.ts
import { apiClient } from './api-client';
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/shared/schemas/note';

export async function fetchNotes(params?: {
  page?: number;
  limit?: number;
  tags?: string[];
  is_archived?: boolean;
}) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.tags) queryParams.set('tags', params.tags.join(','));
  if (params?.is_archived !== undefined) queryParams.set('is_archived', params.is_archived.toString());

  const response = await apiClient.get(`/notes?${queryParams}`);
  return response.data;
}

export async function fetchNote(id: string): Promise<Note> {
  const response = await apiClient.get(`/notes/${id}`);
  return response.data.note;
}

export async function createNote(data: CreateNoteInput): Promise<Note> {
  const response = await apiClient.post('/notes', data);
  return response.data.note;
}

export async function updateNote(id: string, data: UpdateNoteInput): Promise<Note> {
  const response = await apiClient.put(`/notes/${id}`, data);
  return response.data.note;
}

export async function deleteNote(id: string): Promise<void> {
  await apiClient.delete(`/notes/${id}`);
}

export async function reindexNotes(): Promise<{ message: string; queued_count: number }> {
  const response = await apiClient.post('/notes/reindex', {});
  return response.data;
}
```

```typescript
// frontend/lib/hooks/use-notes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotes, fetchNote, createNote, updateNote, deleteNote } from '../notes-service';

export function useNotes(params?: { tags?: string[]; is_archived?: boolean }) {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: () => fetchNotes(params),
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: ['notes', id],
    queryFn: () => fetchNote(id),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateNote(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', variables.id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
```

---

### Story 2: Notes List Page Integration

**Goal:** Connect the existing notes list UI to the API.

**Key Tasks:**
- Update `frontend/app/(dashboard)/notes/page.tsx` to use `useNotes` hook
- Display fetched notes in grid/list view
- Implement pagination controls
- Add tag filter UI
- Handle loading states (skeleton loaders)
- Handle empty states (no notes yet)

**Acceptance Criteria:**
- [ ] Notes list displays real data from API
- [ ] Pagination works (next/prev buttons)
- [ ] Tag filter updates notes list
- [ ] Loading shows skeleton loaders
- [ ] Empty state shows helpful message ("Create your first note")
- [ ] Clicking note navigates to edit page
- [ ] Embedding status badge shows on each note

**Implementation:**
```typescript
// frontend/app/(dashboard)/notes/page.tsx
'use client';

import { useState } from 'react';
import { useNotes } from '@/lib/hooks/use-notes';
import { NoteCard } from '@/components/notes/note-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotesPage() {
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data, isLoading, error } = useNotes({
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div>Error loading notes: {error.message}</div>;
  }

  if (data.notes.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">No notes yet</h2>
        <p className="text-muted-foreground mb-4">Create your first note to get started</p>
        <Button asChild>
          <a href="/notes/new">Create Note</a>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Tag filter UI */}
      {/* Notes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-8">
        <Button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="flex items-center px-4">
          Page {page} of {data.pagination.totalPages}
        </span>
        <Button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= data.pagination.totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

---

### Story 3: Note Creation Page Integration

**Goal:** Implement note creation form with markdown editor.

**Key Tasks:**
- Update `frontend/app/(dashboard)/notes/new/page.tsx`
- Connect form to `useCreateNote` mutation
- Implement real-time markdown preview
- Add tag selection/creation
- Handle form validation
- Show success toast and redirect on save

**Acceptance Criteria:**
- [ ] Note creation form submits to API
- [ ] Title and content validation works
- [ ] Tag selection allows choosing existing tags
- [ ] Can create new tags inline
- [ ] Markdown preview updates in real-time
- [ ] Success toast shown: "Note created successfully"
- [ ] Redirects to notes list after creation
- [ ] Loading state disables form during submission

**Implementation:**
```typescript
// frontend/app/(dashboard)/notes/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateNoteSchema } from '@/shared/schemas/note';
import { useCreateNote } from '@/lib/hooks/use-notes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownPreview } from '@/components/notes/markdown-preview';

export default function NewNotePage() {
  const router = useRouter();
  const createNote = useCreateNote();
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm({
    resolver: zodResolver(CreateNoteSchema),
    defaultValues: {
      title: '',
      content: '',
      tags: [],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await createNote.mutateAsync(data);
      toast.success('Note created successfully!');
      router.push('/notes');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create note');
    }
  };

  const content = form.watch('content');

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Note</h1>
        <Button type="submit" disabled={createNote.isPending}>
          {createNote.isPending ? 'Saving...' : 'Save Note'}
        </Button>
      </div>

      <div className="space-y-4">
        <Input
          {...form.register('title')}
          placeholder="Note title"
          className="text-2xl font-semibold"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
        )}

        {/* Tag selection component */}

        <div className="flex gap-2 mb-2">
          <Button
            type="button"
            variant={!showPreview ? 'default' : 'outline'}
            onClick={() => setShowPreview(false)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant={showPreview ? 'default' : 'outline'}
            onClick={() => setShowPreview(true)}
          >
            Preview
          </Button>
        </div>

        {!showPreview ? (
          <Textarea
            {...form.register('content')}
            placeholder="Write your note in markdown..."
            rows={20}
            className="font-mono"
          />
        ) : (
          <MarkdownPreview content={content} />
        )}

        {form.formState.errors.content && (
          <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
        )}
      </div>
    </form>
  );
}
```

---

### Story 4: Note Viewing and Editing

**Goal:** Implement note viewing and editing functionality.

**Key Tasks:**
- Update `frontend/app/(dashboard)/notes/[id]/edit/page.tsx`
- Fetch note data with `useNote` hook
- Pre-populate form with existing data
- Submit updates with `useUpdateNote` mutation
- Display embedding status badge
- Show "Last updated" timestamp
- Handle concurrent edit conflicts (optional)

**Acceptance Criteria:**
- [ ] Note editor loads existing note data
- [ ] Title and content pre-populated
- [ ] Tags pre-selected
- [ ] Update form submits successfully
- [ ] Embedding status badge shows: pending/completed/failed
- [ ] Success toast shown: "Note updated successfully"
- [ ] Stays on edit page after save (or redirects to list)
- [ ] Loading state while fetching note

**Implementation:**
```typescript
// frontend/app/(dashboard)/notes/[id]/edit/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useNote, useUpdateNote } from '@/lib/hooks/use-notes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateNoteSchema } from '@/shared/schemas/note';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function EditNotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;

  const { data: note, isLoading } = useNote(noteId);
  const updateNote = useUpdateNote();

  const form = useForm({
    resolver: zodResolver(UpdateNoteSchema),
    values: note ? {
      title: note.title,
      content: note.content,
      tags: note.tags,
    } : undefined,
  });

  const onSubmit = async (data: any) => {
    try {
      await updateNote.mutateAsync({ id: noteId, data });
      toast.success('Note updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update note');
    }
  };

  if (isLoading) {
    return <div>Loading note...</div>;
  }

  if (!note) {
    return <div>Note not found</div>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Note</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={note.embedding_status === 'completed' ? 'success' : 'warning'}>
              Embedding: {note.embedding_status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date(note.updated_at).toLocaleString()}
            </span>
          </div>
        </div>
        <Button type="submit" disabled={updateNote.isPending}>
          {updateNote.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Form fields same as create page */}
    </form>
  );
}
```

---

### Story 5: Note Deletion and Tag Management

**Goal:** Implement note deletion with confirmation and tag management UI.

**Key Tasks:**
- Add delete button to note editor
- Show confirmation dialog before deletion
- Use `useDeleteNote` mutation
- Implement tag management component
- Allow creating/editing/deleting tags
- Show tag usage count

**Acceptance Criteria:**
- [ ] Delete button shows on note editor
- [ ] Confirmation dialog: "Are you sure you want to delete this note?"
- [ ] Deletion calls API and invalidates cache
- [ ] Success toast shown: "Note deleted"
- [ ] Redirects to notes list after deletion
- [ ] Tag management shows all user's tags
- [ ] Can create new tags with color picker
- [ ] Can delete unused tags
- [ ] Tag filter in notes list works

**Implementation:**
```typescript
// Delete button component
'use client';

import { useRouter } from 'next/navigation';
import { useDeleteNote } from '@/lib/hooks/use-notes';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const router = useRouter();
  const deleteNote = useDeleteNote();

  const handleDelete = async () => {
    try {
      await deleteNote.mutateAsync(noteId);
      toast.success('Note deleted successfully');
      router.push('/notes');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete note');
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Note</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will archive the note. You can restore it later from the archived notes section.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## Dependencies

**Depends On:**
- ✅ Epic 3: Backend Notes CRUD
- ✅ Epic 5: Frontend Auth Logic

**Blocks:**
- Epic 8: Testing & Deployment (needs working notes CRUD)

---

## Risk Mitigation

### Primary Risks

1. **Large Notes Performance**
   - Risk: Markdown rendering slow for very large notes
   - Mitigation: Lazy-load markdown preview, virtualize long content
   - Limit: Warn users if note exceeds 50KB

2. **Optimistic Update Conflicts**
   - Risk: Optimistic UI update conflicts with server state
   - Mitigation: React Query handles this automatically with cache invalidation
   - UX: Show conflict notification if needed

3. **Auto-Save Complexity**
   - Risk: Auto-save may cause too many API calls
   - Mitigation: Debounce auto-save (save after 2 seconds of inactivity)
   - MVP: Manual save only, defer auto-save to post-MVP

---

## Definition of Done

- [ ] All 5 stories completed with acceptance criteria met
- [ ] Notes list displays real data from API
- [ ] Can create new notes with tags
- [ ] Can edit existing notes
- [ ] Can delete notes with confirmation
- [ ] Tag management works (create, delete, filter)
- [ ] Embedding status displayed on notes
- [ ] Loading states and error handling work
- [ ] Toast notifications for all actions

---

## Success Metrics

**Performance:** Notes list loads in <2 seconds

**UX:** Note creation/edit feels responsive with <500ms perceived latency

**Reliability:** Cache invalidation keeps UI in sync with server

---

## Notes for Developers

- **Reuse existing UI** - Focus on wiring logic, not rebuilding components
- **Use React Query** - Handles caching, loading, error states automatically
- **Optimistic updates** - Make UI feel instant even before API responds
- **Test with real data** - Create 50+ notes to test pagination and performance

---

## Handoff to Next Epic

Once Epic 6 is complete, Epic 7 (Frontend Search Logic) can begin. Developers will have:
- ✅ Fully functional notes CRUD
- ✅ State management working
- ✅ User can create, edit, delete notes

Epic 7 will implement the search interface for finding notes.
