"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NoteCard, type Note } from "@/components/notes/note-card"
import { NotesControls, type SortOption, type ViewMode } from "@/components/notes/notes-controls"
import Link from "next/link"

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_NOTES: Note[] = [
  {
    id: "1",
    title: "Getting Started with the MCP Protocol for Knowledge Management",
    content: "# MCP Protocol\n\nThe Model Context Protocol enables seamless communication between AI assistants and external tools. This guide covers setup, configuration, and best practices for integrating MCP into your knowledge management workflow.",
    tags: [
      { id: "t1", name: "MCP", color: "blue" },
      { id: "t2", name: "Tutorial", color: "green" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25),
    isIndexed: true,
    wordCount: 1240,
  },
  {
    id: "2",
    title: "Meeting Notes: Q1 Product Roadmap Review Session",
    content: "## Key Decisions\n\n- Prioritize search performance improvements\n- Launch new tagging system in March\n- Defer mobile app to Q2\n\n## Action Items\n\nJohn will prepare the technical spec for vector search.",
    tags: [
      { id: "t3", name: "Meeting Notes", color: "yellow" },
      { id: "t4", name: "Architecture", color: "purple" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isIndexed: true,
    wordCount: 856,
  },
  {
    id: "3",
    title: "TypeScript Best Practices and Design Patterns for 2025",
    content: "**Strict mode** should always be enabled. Use branded types for domain modeling. Prefer discriminated unions over type assertions.\n\nThis document covers advanced TypeScript patterns including the builder pattern, repository pattern, and proper error handling with Result types.",
    tags: [
      { id: "t5", name: "TypeScript", color: "blue" },
      { id: "t6", name: "Architecture", color: "purple" },
      { id: "t7", name: "Tutorial", color: "green" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isIndexed: true,
    wordCount: 2100,
  },
  {
    id: "4",
    title: "Personal Goals and Weekly Habit Tracker for February",
    content: "## This Week's Focus\n\n1. Exercise 4 times\n2. Read 30 pages daily\n3. Complete React course module 5\n4. Meditate 10 minutes every morning",
    tags: [
      { id: "t8", name: "Personal", color: "pink" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isIndexed: true,
    wordCount: 320,
  },
  {
    id: "5",
    title: "Research: Vector Embeddings for Semantic Search Implementation",
    content: "Vector embeddings transform text into numerical representations that capture semantic meaning. Popular models include OpenAI's text-embedding-3 and Cohere's embed-v3.\n\n## Database Options\n- pgvector with PostgreSQL\n- Pinecone\n- Qdrant\n- Weaviate",
    tags: [
      { id: "t9", name: "Research", color: "orange" },
      { id: "t10", name: "MCP", color: "blue" },
      { id: "t11", name: "Architecture", color: "purple" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    isIndexed: false,
    wordCount: 1680,
  },
  {
    id: "6",
    title: "React Server Components: A Deep Dive into the New Paradigm",
    content: "RSCs run on the server and produce HTML that is streamed to the client. They cannot use hooks or browser APIs but can directly access databases and file systems.\n\n## Benefits\n- Reduced bundle size\n- Direct backend access\n- Automatic code splitting",
    tags: [
      { id: "t12", name: "React", color: "teal" },
      { id: "t13", name: "Tutorial", color: "green" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    isIndexed: true,
    wordCount: 3200,
  },
  {
    id: "7",
    title: "Building a CLI Tool with Node.js and Commander.js",
    content: "Step-by-step guide to creating a command-line interface tool. We'll use Commander.js for argument parsing, Chalk for colored output, and Inquirer for interactive prompts.",
    tags: [
      { id: "t14", name: "TypeScript", color: "blue" },
      { id: "t15", name: "Tutorial", color: "green" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    isIndexed: true,
    wordCount: 1450,
  },
  {
    id: "8",
    title: "Database Schema Design for the Personal Vault Application",
    content: "## Tables\n\n- `notes` - Core note storage with full-text search\n- `tags` - Tag definitions with color metadata\n- `note_tags` - Many-to-many relationship\n- `embeddings` - Vector storage for semantic search\n\nUsing PostgreSQL with pgvector extension.",
    tags: [
      { id: "t16", name: "Architecture", color: "purple" },
      { id: "t17", name: "MCP", color: "blue" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
    isIndexed: true,
    wordCount: 920,
  },
  {
    id: "9",
    title: "Weekly Team Standup Notes - Week 6",
    content: "### Monday\n- Deployed search improvements\n- Fixed pagination bug in notes list\n\n### Wednesday\n- Code review for tag filtering PR\n- Started work on export feature\n\n### Friday\n- Sprint retrospective\n- Planning for next iteration",
    tags: [
      { id: "t18", name: "Meeting Notes", color: "yellow" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    isIndexed: true,
    wordCount: 410,
  },
  {
    id: "10",
    title: "How to Set Up Tailwind CSS v4 with Next.js 16",
    content: "Tailwind CSS v4 introduces a new engine with significantly faster build times. Configuration has moved from tailwind.config to CSS-based setup. Here's how to migrate your Next.js project.",
    tags: [
      { id: "t19", name: "React", color: "teal" },
      { id: "t20", name: "Tutorial", color: "green" },
      { id: "t21", name: "TypeScript", color: "blue" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    isIndexed: true,
    wordCount: 1890,
  },
  {
    id: "11",
    title: "Bookmarks: Useful AI and Machine Learning Resources",
    content: "A curated list of resources for staying up to date with AI developments:\n- Hugging Face blog\n- Anthropic research papers\n- LangChain documentation\n- The Batch by Andrew Ng",
    tags: [
      { id: "t22", name: "Research", color: "orange" },
      { id: "t23", name: "Personal", color: "pink" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    isIndexed: false,
    wordCount: 540,
  },
  {
    id: "12",
    title: "Error Handling Patterns in TypeScript Applications",
    content: "## The Result Pattern\n\nInstead of throwing exceptions, return a Result type that explicitly represents success or failure. This makes error handling composable and type-safe.\n\n```typescript\ntype Result<T, E> = { ok: true; value: T } | { ok: false; error: E }\n```",
    tags: [
      { id: "t24", name: "TypeScript", color: "blue" },
      { id: "t25", name: "Architecture", color: "purple" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    isIndexed: true,
    wordCount: 1750,
  },
]

const PAGE_SIZE = 20

// ── Skeleton loader ──────────────────────────────────────────────────────────

function GridSkeleton({ viewMode }: { viewMode: ViewMode }) {
  const count = viewMode === "grid" ? 9 : 6
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            <div className="flex gap-1">
              <div className="h-7 w-7 rounded bg-muted animate-pulse" />
              <div className="h-7 w-7 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {hasFilters ? "No matching notes" : "No notes yet"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {hasFilters
          ? "Try adjusting your filters or search query to find what you're looking for."
          : "Create your first note to get started"}
      </p>
      {!hasFilters && (
        <Link href="/notes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Note
          </Button>
        </Link>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function NotesView() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("updatedAt")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(true)

  // Restore view preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("notesView")
    if (stored === "list" || stored === "grid") {
      setViewMode(stored)
    }
    // Simulate initial load
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem("notesView", mode)
  }, [])

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }, [])

  const handleTagClick = useCallback((tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev : [...prev, tagName]
    )
  }, [])

  const handleEdit = useCallback(
    (noteId: string) => {
      router.push(`/notes/${noteId}/edit`)
    },
    [router]
  )

  const handleDelete = useCallback((noteId: string) => {
    console.log("Delete note:", noteId)
  }, [])

  // Filter and sort
  const filteredNotes = useMemo(() => {
    let notes = [...MOCK_NOTES]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.name.toLowerCase().includes(q))
      )
    }

    // Tag filter
    if (selectedTags.length > 0) {
      notes = notes.filter((n) =>
        selectedTags.some((tag) =>
          n.tags.some((t) => t.name === tag)
        )
      )
    }

    // Sort
    notes.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "updatedAt":
          return b.updatedAt.getTime() - a.updatedAt.getTime()
        case "createdAt":
          return b.createdAt.getTime() - a.createdAt.getTime()
        default:
          return 0
      }
    })

    return notes
  }, [searchQuery, selectedTags, sortBy])

  const visibleNotes = filteredNotes.slice(0, visibleCount)
  const hasMore = visibleCount < filteredNotes.length
  const hasFilters = searchQuery.trim().length > 0 || selectedTags.length > 0

  return (
    <div className="flex flex-col">
      <NotesControls
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="p-4 sm:p-6">
        {isLoading ? (
          <GridSkeleton viewMode={viewMode} />
        ) : filteredNotes.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {visibleNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onTagClick={handleTagClick}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onTagClick={handleTagClick}
                    viewMode="list"
                  />
                ))}
              </div>
            )}

            {/* Pagination footer */}
            <div className="flex flex-col items-center gap-3 pt-8">
              <p className="text-sm text-muted-foreground">
                Showing {visibleNotes.length} of {filteredNotes.length} notes
              </p>
              {hasMore && (
                <Button
                  variant="secondary"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  Load More
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
