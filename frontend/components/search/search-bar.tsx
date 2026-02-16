"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, Loader2, X, Clock, TrendingUp, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Suggestion {
  type: "note" | "recent" | "suggested"
  text: string
  noteId?: string
}

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  isSearching: boolean
  isSemanticMode: boolean
  searchDuration?: number
}

// Mock recent searches
const RECENT_SEARCHES = ["MCP protocol setup", "TypeScript patterns", "weekly standup"]

// Mock note titles for suggestions
const NOTE_TITLES = [
  { text: "Getting Started with the MCP Protocol for Knowledge Management", noteId: "1" },
  { text: "Meeting Notes: Q1 Product Roadmap Review Session", noteId: "2" },
  { text: "TypeScript Best Practices and Design Patterns for 2025", noteId: "3" },
  { text: "Personal Goals and Weekly Habit Tracker for February", noteId: "4" },
  { text: "Research: Vector Embeddings for Semantic Search Implementation", noteId: "5" },
  { text: "React Server Components: A Deep Dive into the New Paradigm", noteId: "6" },
  { text: "Building a CLI Tool with Node.js and Commander.js", noteId: "7" },
  { text: "Database Schema Design for the Personal Vault Application", noteId: "8" },
  { text: "Weekly Team Standup Notes - Week 6", noteId: "9" },
  { text: "How to Set Up Tailwind CSS v4 with Next.js 16", noteId: "10" },
  { text: "Bookmarks: Useful AI and Machine Learning Resources", noteId: "11" },
  { text: "Error Handling Patterns in TypeScript Applications", noteId: "12" },
]

const SUGGESTED_QUERIES = [
  "architecture patterns",
  "meeting notes this week",
  "React tutorials",
  "database design",
]

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${safeQuery})`, "gi")
  const parts = text.split(regex)

  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="font-semibold text-foreground">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export function SearchBar({
  query,
  onQueryChange,
  isSearching,
  isSemanticMode,
  searchDuration,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Build suggestion list
  const suggestions: Suggestion[] = []

  if (query.length >= 2) {
    // Matching notes
    const matchingNotes = NOTE_TITLES.filter((n) =>
      n.text.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5)
    matchingNotes.forEach((n) => suggestions.push({ type: "note", text: n.text, noteId: n.noteId }))
  }

  if (query.length === 0 || query.length < 2) {
    // Show recent searches when no input or fewer than 2 chars
    RECENT_SEARCHES.slice(0, 3).forEach((s) =>
      suggestions.push({ type: "recent", text: s })
    )
    // Show suggested queries
    SUGGESTED_QUERIES.slice(0, 3).forEach((s) =>
      suggestions.push({ type: "suggested", text: s })
    )
  }

  const showDropdown = isFocused && suggestions.length > 0

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1)
  }, [query])

  const selectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      onQueryChange(suggestion.text)
      setIsFocused(false)
      inputRef.current?.blur()
    },
    [onQueryChange]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          selectSuggestion(suggestions[activeIndex])
        }
        break
      case "Escape":
        setIsFocused(false)
        inputRef.current?.blur()
        break
    }
  }

  const getIcon = (type: Suggestion["type"]) => {
    switch (type) {
      case "note":
        return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      case "recent":
        return <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      case "suggested":
        return <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search your knowledge base..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-13 pl-12 pr-24 text-base transition-shadow",
            isFocused && "ring-2 ring-primary"
          )}
          aria-label="Search notes"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? "search-suggestions" : undefined}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          role="combobox"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              onClick={() => {
                onQueryChange("")
                inputRef.current?.focus()
              }}
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isSearching && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          )}
          {!isSearching && searchDuration !== undefined && query.length >= 2 && (
            <span className="text-xs text-muted-foreground tabular-nums">{searchDuration.toFixed(1)}s</span>
          )}
        </div>
      </div>

      {/* Semantic search progress bar */}
      {isSearching && isSemanticMode && (
        <div className="mt-1.5">
          <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "70%" }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Analyzing semantic meaning...
            </p>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => onQueryChange("")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div
          id="search-suggestions"
          ref={dropdownRef}
          className="absolute z-50 mt-1.5 w-full rounded-lg border bg-card shadow-lg overflow-hidden"
          role="listbox"
          aria-label="Search suggestions"
        >
          {/* Group by type */}
          {query.length >= 2 && suggestions.filter((s) => s.type === "note").length > 0 && (
            <div>
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Matching Notes
                </span>
              </div>
              {suggestions
                .map((s, i) => ({ suggestion: s, index: i }))
                .filter(({ suggestion }) => suggestion.type === "note")
                .map(({ suggestion, index }) => (
                  <button
                    key={index}
                    id={`suggestion-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-sm text-left transition-colors",
                      activeIndex === index ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    {getIcon(suggestion.type)}
                    <span className="truncate">{highlightMatch(suggestion.text, query)}</span>
                  </button>
                ))}
            </div>
          )}

          {(query.length < 2) && suggestions.filter((s) => s.type === "recent").length > 0 && (
            <div>
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Searches
                </span>
              </div>
              {suggestions
                .map((s, i) => ({ suggestion: s, index: i }))
                .filter(({ suggestion }) => suggestion.type === "recent")
                .map(({ suggestion, index }) => (
                  <button
                    key={index}
                    id={`suggestion-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-sm text-left transition-colors",
                      activeIndex === index ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    {getIcon(suggestion.type)}
                    <span className="truncate">{suggestion.text}</span>
                  </button>
                ))}
            </div>
          )}

          {(query.length < 2) && suggestions.filter((s) => s.type === "suggested").length > 0 && (
            <div>
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Suggested
                </span>
              </div>
              {suggestions
                .map((s, i) => ({ suggestion: s, index: i }))
                .filter(({ suggestion }) => suggestion.type === "suggested")
                .map(({ suggestion, index }) => (
                  <button
                    key={index}
                    id={`suggestion-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-sm text-left transition-colors",
                      activeIndex === index ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    {getIcon(suggestion.type)}
                    <span className="truncate">{suggestion.text}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
