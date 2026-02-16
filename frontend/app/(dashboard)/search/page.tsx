"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Brain, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"
import { SearchBar } from "@/components/search/search-bar"
import { ModeToggle } from "@/components/search/mode-toggle"
import { SearchFilters } from "@/components/search/search-filters"
import { SearchResults, type SearchResult } from "@/components/search/search-results"
import Link from "next/link"

// ── Mock search results ──────────────────────────────────────────────────────

const MOCK_RESULTS: SearchResult[] = [
  {
    noteId: "1",
    title: "Getting Started with the MCP Protocol for Knowledge Management",
    excerpt:
      "The Model Context Protocol enables seamless communication between AI assistants and external tools. This guide covers setup, configuration, and best practices for integrating MCP into your knowledge management workflow. Learn how to set up MCP servers and connect them to your apps.",
    tags: [
      { id: "t1", name: "MCP", color: "blue" },
      { id: "t2", name: "Tutorial", color: "green" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 25),
    relevanceScore: 97,
    matchCount: 8,
  },
  {
    noteId: "5",
    title: "Research: Vector Embeddings for Semantic Search Implementation",
    excerpt:
      "Vector embeddings transform text into numerical representations that capture semantic meaning. Popular models include OpenAI's text-embedding-3 and Cohere's embed-v3. This research note covers database options like pgvector with PostgreSQL, Pinecone, and Qdrant.",
    tags: [
      { id: "t9", name: "Research", color: "orange" },
      { id: "t10", name: "MCP", color: "blue" },
      { id: "t11", name: "Architecture", color: "purple" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    relevanceScore: 91,
    matchCount: 5,
  },
  {
    noteId: "8",
    title: "Database Schema Design for the Personal Vault Application",
    excerpt:
      "Tables include notes for core note storage with full-text search, tags for definitions with color metadata, note_tags for many-to-many relationships, and embeddings for vector storage. Using PostgreSQL with pgvector extension for semantic search capabilities.",
    tags: [
      { id: "t16", name: "Architecture", color: "purple" },
      { id: "t17", name: "MCP", color: "blue" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
    relevanceScore: 85,
    matchCount: 4,
  },
  {
    noteId: "3",
    title: "TypeScript Best Practices and Design Patterns for 2025",
    excerpt:
      "Strict mode should always be enabled. Use branded types for domain modeling. Prefer discriminated unions over type assertions. This document covers advanced TypeScript patterns including the builder pattern, repository pattern, and proper error handling with Result types.",
    tags: [
      { id: "t5", name: "TypeScript", color: "blue" },
      { id: "t6", name: "Architecture", color: "purple" },
      { id: "t7", name: "Tutorial", color: "green" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    relevanceScore: 78,
    matchCount: 6,
  },
  {
    noteId: "12",
    title: "Error Handling Patterns in TypeScript Applications",
    excerpt:
      "The Result Pattern: Instead of throwing exceptions, return a Result type that explicitly represents success or failure. This makes error handling composable and type-safe. A proper Result type can be implemented as a discriminated union.",
    tags: [
      { id: "t24", name: "TypeScript", color: "blue" },
      { id: "t25", name: "Architecture", color: "purple" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    relevanceScore: 72,
    matchCount: 3,
  },
  {
    noteId: "6",
    title: "React Server Components: A Deep Dive into the New Paradigm",
    excerpt:
      "RSCs run on the server and produce HTML that is streamed to the client. They cannot use hooks or browser APIs but can directly access databases and file systems. Benefits include reduced bundle size, direct backend access, and automatic code splitting.",
    tags: [
      { id: "t12", name: "React", color: "teal" },
      { id: "t13", name: "Tutorial", color: "green" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    relevanceScore: 65,
    matchCount: 2,
  },
  {
    noteId: "10",
    title: "How to Set Up Tailwind CSS v4 with Next.js 16",
    excerpt:
      "Tailwind CSS v4 introduces a new engine with significantly faster build times. Configuration has moved from tailwind.config to CSS-based setup. Here is how to migrate your Next.js project to the latest stack with the new configuration approach.",
    tags: [
      { id: "t19", name: "React", color: "teal" },
      { id: "t20", name: "Tutorial", color: "green" },
      { id: "t21", name: "TypeScript", color: "blue" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    relevanceScore: 58,
    matchCount: 2,
  },
  {
    noteId: "2",
    title: "Meeting Notes: Q1 Product Roadmap Review Session",
    excerpt:
      "Key Decisions: Prioritize search performance improvements. Launch new tagging system in March. Defer mobile app to Q2. Action Items: John will prepare the technical spec for vector search integration and optimization of the current text search pipeline.",
    tags: [
      { id: "t3", name: "Meeting Notes", color: "yellow" },
      { id: "t4", name: "Architecture", color: "purple" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    relevanceScore: 52,
    matchCount: 3,
  },
  {
    noteId: "7",
    title: "Building a CLI Tool with Node.js and Commander.js",
    excerpt:
      "Step-by-step guide to creating a command-line interface tool. We will use Commander.js for argument parsing, Chalk for colored output, and Inquirer for interactive prompts. The CLI will support subcommands, flags, and interactive user input.",
    tags: [
      { id: "t14", name: "TypeScript", color: "blue" },
      { id: "t15", name: "Tutorial", color: "green" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    relevanceScore: 45,
    matchCount: 1,
  },
  {
    noteId: "9",
    title: "Weekly Team Standup Notes - Week 6",
    excerpt:
      "Monday: Deployed search improvements. Fixed pagination bug in notes list. Wednesday: Code review for tag filtering PR. Started work on export feature. Friday: Sprint retrospective and planning for next iteration.",
    tags: [
      { id: "t18", name: "Meeting Notes", color: "yellow" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    relevanceScore: 40,
    matchCount: 2,
  },
  {
    noteId: "4",
    title: "Personal Goals and Weekly Habit Tracker for February",
    excerpt:
      "This week focus areas: Exercise 4 times. Read 30 pages daily. Complete React course module 5. Meditate 10 minutes every morning. Tracking progress on all personal development goals throughout the month.",
    tags: [
      { id: "t8", name: "Personal", color: "pink" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    relevanceScore: 30,
    matchCount: 1,
  },
  {
    noteId: "11",
    title: "Bookmarks: Useful AI and Machine Learning Resources",
    excerpt:
      "A curated list of resources for staying up to date with AI developments: Hugging Face blog, Anthropic research papers, LangChain documentation, The Batch by Andrew Ng. Essential reading for understanding modern AI capabilities and trends.",
    tags: [
      { id: "t22", name: "Research", color: "orange" },
      { id: "t23", name: "Personal", color: "pink" },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    relevanceScore: 25,
    matchCount: 1,
  },
]

const PAGE_SIZE = 8

// ── Search page ──────────────────────────────────────────────────────────────

type SearchMode = "text" | "semantic"
type DateRange = "week" | "month" | "year" | undefined
type SortOption = "relevance" | "date-desc" | "date-asc" | "title"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<SearchMode>("text")
  const [isSearching, setIsSearching] = useState(false)
  const [searchDuration, setSearchDuration] = useState<number | undefined>(undefined)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Filter state
  const [dateRange, setDateRange] = useState<DateRange>(undefined)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("relevance")

  const debouncedQuery = useDebounce(query, 300)

  // Simulate search
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setIsSearching(false)
      setSearchDuration(undefined)
      return
    }

    setIsSearching(true)
    const delay = mode === "semantic" ? 1200 + Math.random() * 800 : 200 + Math.random() * 300
    const start = performance.now()

    const timer = setTimeout(() => {
      setSearchDuration((performance.now() - start) / 1000)
      setIsSearching(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [debouncedQuery, mode])

  // Reset visible count when query changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [debouncedQuery, dateRange, selectedTags, sortBy])

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }, [])

  const handleClearFilters = useCallback(() => {
    setDateRange(undefined)
    setSelectedTags([])
    setSortBy("relevance")
  }, [])

  const activeFilterCount =
    (dateRange ? 1 : 0) + selectedTags.length + (sortBy !== "relevance" ? 1 : 0)

  // Filter and sort results
  const filteredResults = useMemo(() => {
    if (debouncedQuery.length < 2) return []

    let results = MOCK_RESULTS.filter((r) => {
      const q = debouncedQuery.toLowerCase()
      return (
        r.title.toLowerCase().includes(q) ||
        r.excerpt.toLowerCase().includes(q) ||
        r.tags.some((t) => t.name.toLowerCase().includes(q))
      )
    })

    // Tag filter
    if (selectedTags.length > 0) {
      results = results.filter((r) =>
        selectedTags.some((tag) => r.tags.some((t) => t.name === tag))
      )
    }

    // Date filter (mock)
    if (dateRange) {
      const now = Date.now()
      const ranges: Record<string, number> = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000,
      }
      const cutoff = now - (ranges[dateRange] || 0)
      results = results.filter((r) => r.updatedAt.getTime() >= cutoff)
    }

    // Sort
    results.sort((a, b) => {
      switch (sortBy) {
        case "relevance":
          return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
        case "date-desc":
          return b.updatedAt.getTime() - a.updatedAt.getTime()
        case "date-asc":
          return a.updatedAt.getTime() - b.updatedAt.getTime()
        case "title":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return results
  }, [debouncedQuery, selectedTags, dateRange, sortBy])

  const visibleResults = filteredResults.slice(0, visibleCount)
  const hasMore = visibleCount < filteredResults.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Search</h1>
          </div>
          <Badge variant="secondary" className="text-xs">
            {filteredResults.length} notes indexed
          </Badge>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-5">
          {/* Mode toggle */}
          <div className="max-w-sm mx-auto w-full sm:max-w-md">
            <ModeToggle mode={mode} onModeChange={setMode} />
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto w-full">
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              isSearching={isSearching}
              isSemanticMode={mode === "semantic"}
              searchDuration={searchDuration}
            />
          </div>

          {/* Filters */}
          <SearchFilters
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onClear={handleClearFilters}
            activeFilterCount={activeFilterCount}
          />

          {/* Results */}
          <SearchResults
            results={visibleResults}
            query={debouncedQuery}
            isLoading={isSearching}
            isSemantic={mode === "semantic"}
            totalCount={filteredResults.length}
            searchDuration={searchDuration}
            activeFilters={selectedTags}
            onLoadMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
            hasMore={hasMore}
          />
        </div>
      </main>
    </div>
  )
}
