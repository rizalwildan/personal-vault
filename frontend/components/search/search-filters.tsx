"use client"

import { useState } from "react"
import { Filter, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type DateRange = "week" | "month" | "year" | undefined
type SortOption = "relevance" | "date-desc" | "date-asc" | "title"

interface SearchFiltersProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  selectedTags: string[]
  onTagToggle: (tag: string) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  onClear: () => void
  activeFilterCount: number
}

const AVAILABLE_TAGS = [
  { name: "MCP", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { name: "Tutorial", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { name: "Meeting Notes", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { name: "Architecture", color: "bg-violet-100 text-violet-800 border-violet-200" },
  { name: "TypeScript", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { name: "Personal", color: "bg-pink-100 text-pink-800 border-pink-200" },
  { name: "Research", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { name: "React", color: "bg-teal-100 text-teal-800 border-teal-200" },
]

const DATE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "Any time", value: undefined },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last year", value: "year" },
]

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Newest first", value: "date-desc" },
  { label: "Oldest first", value: "date-asc" },
  { label: "Title (A-Z)", value: "title" },
]

export function SearchFilters({
  dateRange,
  onDateRangeChange,
  selectedTags,
  onTagToggle,
  sortBy,
  onSortChange,
  onClear,
  activeFilterCount,
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
          aria-expanded={isOpen}
          aria-controls="search-filters-panel"
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
            aria-hidden="true"
          />
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear all
          </Button>
        )}
      </div>

      {/* Filters panel */}
      {isOpen && (
        <div
          id="search-filters-panel"
          className="rounded-lg border bg-card p-4 grid gap-5 sm:grid-cols-3"
        >
          {/* Date range */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Date Range</span>
            <div className="flex flex-col gap-1.5">
              {DATE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => onDateRangeChange(option.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm text-left transition-colors",
                    dateRange === option.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Tags</span>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {AVAILABLE_TAGS.map((tag) => (
                <label
                  key={tag.name}
                  className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={selectedTags.includes(tag.name)}
                    onCheckedChange={() => onTagToggle(tag.name)}
                    aria-label={`Filter by ${tag.name}`}
                  />
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      tag.color
                    )}
                  >
                    {tag.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Sort By</span>
            <div className="flex flex-col gap-1.5">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm text-left transition-colors",
                    sortBy === option.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {activeFilterCount > 0 && !isOpen && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Active filters">
          <span className="text-xs text-muted-foreground mr-1">Filtered by:</span>
          {dateRange && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {DATE_OPTIONS.find((d) => d.value === dateRange)?.label}
              <button onClick={() => onDateRangeChange(undefined)} aria-label="Remove date filter">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 text-xs">
              #{tag}
              <button onClick={() => onTagToggle(tag)} aria-label={`Remove ${tag} filter`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
