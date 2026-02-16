"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Star, Search as SearchIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

// ── Types ────────────────────────────────────────────────────────────────────

export interface SearchResult {
  noteId: string
  title: string
  excerpt: string
  tags: { id: string; name: string; color: string }[]
  updatedAt: Date
  relevanceScore?: number
  matchCount: number
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  isLoading: boolean
  isSemantic: boolean
  totalCount: number
  searchDuration?: number
  activeFilters: string[]
  onLoadMore: () => void
  hasMore: boolean
}

// ── Highlight util ───────────────────────────────────────────────────────────

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${safeQuery})`, "gi")
  const parts = text.split(regex)

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-foreground rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

// ── Tag colors ───────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  red: "bg-red-100 text-red-800 border-red-200",
  yellow: "bg-amber-100 text-amber-800 border-amber-200",
  purple: "bg-violet-100 text-violet-800 border-violet-200",
  pink: "bg-pink-100 text-pink-800 border-pink-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  teal: "bg-teal-100 text-teal-800 border-teal-200",
}

function getTagClasses(color: string) {
  return TAG_COLORS[color] || "bg-secondary text-secondary-foreground border-border"
}

// ── Relevance score display ──────────────────────────────────────────────────

function RelevanceScore({ score }: { score: number }) {
  const stars = Math.round(score / 20) // 0-100 to 0-5
  return (
    <div className="flex items-center gap-1.5" title={`${score}% relevance`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < stars ? "fill-primary text-primary" : "text-muted-foreground/30"
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{score}%</span>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-full rounded bg-muted animate-pulse" />
              <div className="h-3.5 w-5/6 rounded bg-muted animate-pulse" />
              <div className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-1.5">
                <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
              </div>
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Empty states ─────────────────────────────────────────────────────────────

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
        <SearchIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {"No notes found for '"}{query}{"'"}
      </h3>
      <ul className="text-sm text-muted-foreground space-y-1 mt-3">
        <li>Try different keywords</li>
        <li>Use semantic search for meaning-based results</li>
        <li>Check your spelling</li>
      </ul>
    </div>
  )
}

function InitialState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
        <SearchIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        Start typing to search your notes
      </h3>
      <p className="text-sm text-muted-foreground">
        Search by title, content, or tags across your entire knowledge base.
      </p>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function SearchResults({
  results,
  query,
  isLoading,
  isSemantic,
  totalCount,
  searchDuration,
  activeFilters,
  onLoadMore,
  hasMore,
}: SearchResultsProps) {
  // Initial state
  if (!query || query.length < 2) {
    return <InitialState />
  }

  // Loading
  if (isLoading) {
    return (
      <div aria-live="polite" aria-busy="true">
        <ResultSkeleton />
      </div>
    )
  }

  // No results
  if (results.length === 0) {
    return <NoResultsState query={query} />
  }

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      {/* Results metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{totalCount}</span> result{totalCount !== 1 ? "s" : ""}
          {searchDuration !== undefined && (
            <span className="ml-1 tabular-nums">in {searchDuration.toFixed(1)}s</span>
          )}
        </p>
        {activeFilters.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Filtered by: {activeFilters.map((f) => `#${f}`).join(", ")}
          </p>
        )}
      </div>

      {/* Result cards */}
      <div className="flex flex-col gap-3">
        {results.map((result) => (
          <Link key={result.noteId} href={`/notes/${result.noteId}`} className="block group">
            <Card className="transition-colors hover:bg-accent/40">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {highlightText(result.title, query)}
                    </h3>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {result.matchCount} match{result.matchCount !== 1 ? "es" : ""}
                  </span>
                </div>

                {/* Excerpt */}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                  {highlightText(result.excerpt, query)}
                </p>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {result.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          getTagClasses(tag.color)
                        )}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {isSemantic && result.relevanceScore !== undefined && (
                      <RelevanceScore score={result.relevanceScore} />
                    )}
                    <time
                      dateTime={result.updatedAt.toISOString()}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDistanceToNow(result.updatedAt, { addSuffix: true })}
                    </time>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Load more */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <p className="text-xs text-muted-foreground">
          Showing {results.length} of {totalCount} results
        </p>
        {hasMore && (
          <Button variant="secondary" onClick={onLoadMore}>
            Load More
          </Button>
        )}
      </div>
    </div>
  )
}
