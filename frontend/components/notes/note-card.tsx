"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, CheckCircle2, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export interface NoteTag {
  id: string
  name: string
  color: string
}

export interface Note {
  id: string
  title: string
  content: string
  tags: NoteTag[]
  createdAt: Date
  updatedAt: Date
  isIndexed: boolean
  wordCount: number
}

interface NoteCardProps {
  note: Note
  onEdit: (noteId: string) => void
  onDelete: (noteId: string) => void
  onTagClick?: (tagName: string) => void
  viewMode: "list" | "grid"
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + "..."
}

function stripMarkdown(md: string) {
  return md
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/!\[.*?\]\(.+?\)/g, "")
    .replace(/>\s/g, "")
    .replace(/[-*+]\s/g, "")
    .replace(/\d+\.\s/g, "")
    .trim()
}

function getPreviewLines(content: string, lines: number = 2) {
  const stripped = stripMarkdown(content)
  const split = stripped.split("\n").filter(Boolean)
  return split.slice(0, lines).join(" ")
}

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

const MAX_VISIBLE_TAGS = 5

export function NoteCard({ note, onEdit, onDelete, onTagClick, viewMode }: NoteCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/notes/${note.id}`)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(note.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(note.id)
  }

  const handleTagClick = (e: React.MouseEvent, tagName: string) => {
    e.stopPropagation()
    onTagClick?.(tagName)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleCardClick()
    }
  }

  const visibleTags = note.tags.slice(0, MAX_VISIBLE_TAGS)
  const remainingTags = note.tags.length - MAX_VISIBLE_TAGS
  const preview = getPreviewLines(note.content, viewMode === "list" ? 1 : 2)

  if (viewMode === "list") {
    return (
      <Card
        className="cursor-pointer transition-all duration-150 hover:shadow-md hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="article"
        aria-label={`Note: ${note.title}`}
      >
        <CardContent className="flex items-center gap-4 p-4">
          {/* Indexing status */}
          <div className="shrink-0" aria-label={note.isIndexed ? "Indexed" : "Not indexed"}>
            {note.isIndexed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />
            )}
          </div>

          {/* Title + preview */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {truncateText(note.title, 100)}
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {note.wordCount} words
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {truncateText(preview, 120)}
            </p>
          </div>

          {/* Tags */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {visibleTags.map((tag) => (
              <button
                key={tag.id}
                onClick={(e) => handleTagClick(e, tag.name)}
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-70",
                  getTagClasses(tag.color)
                )}
              >
                {tag.name}
              </button>
            ))}
            {remainingTags > 0 && (
              <span className="text-[10px] text-muted-foreground">
                +{remainingTags} more
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 text-xs text-muted-foreground">
            <time dateTime={note.updatedAt.toISOString()}>
              {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
            </time>
            <span className="text-[10px]">
              Created {formatDistanceToNow(note.createdAt, { addSuffix: true })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleEdit}
              aria-label={`Edit ${note.title}`}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              aria-label={`Delete ${note.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view
  return (
    <Card
      className="cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`Note: ${note.title}`}
    >
      <CardHeader className="pb-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
            {truncateText(note.title, 100)}
          </CardTitle>
          <div className="shrink-0" aria-label={note.isIndexed ? "Indexed" : "Not indexed"}>
            {note.isIndexed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {/* Content preview */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {truncateText(preview, 160)}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {visibleTags.map((tag) => (
            <button
              key={tag.id}
              onClick={(e) => handleTagClick(e, tag.name)}
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-70",
                getTagClasses(tag.color)
              )}
            >
              {tag.name}
            </button>
          ))}
          {remainingTags > 0 && (
            <span className="text-[10px] text-muted-foreground">
              +{remainingTags} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <time
            dateTime={note.updatedAt.toISOString()}
            className="text-[11px] text-muted-foreground"
          >
            {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
          </time>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleEdit}
              aria-label={`Edit ${note.title}`}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              aria-label={`Delete ${note.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
