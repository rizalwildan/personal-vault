"use client"

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bold,
  Italic,
  Heading,
  Link as LinkIcon,
  List,
  Code,
  ImageIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { MarkdownPreview } from "@/components/notes/markdown-preview"
import { useDebouncedCallback } from "@/hooks/use-debounce"

// ── Types ────────────────────────────────────────────────────────────────────

interface NoteEditorData {
  id?: string
  title: string
  content: string
  tags: { id: string; name: string; color: string }[]
  createdAt?: Date
  updatedAt?: Date
  wordCount: number
  isIndexed: boolean
}

type SaveStatus = "saved" | "saving" | "draft" | "unsaved"

interface MarkdownEditorProps {
  initialData?: Partial<NoteEditorData>
  isNew?: boolean
}

// ── Available tags for autocomplete ──────────────────────────────────────────

const AVAILABLE_TAGS = [
  { id: "t1", name: "MCP", color: "blue" },
  { id: "t2", name: "Tutorial", color: "green" },
  { id: "t3", name: "Meeting Notes", color: "yellow" },
  { id: "t4", name: "Architecture", color: "purple" },
  { id: "t5", name: "TypeScript", color: "blue" },
  { id: "t6", name: "React", color: "teal" },
  { id: "t7", name: "Research", color: "orange" },
  { id: "t8", name: "Personal", color: "pink" },
]

const TAG_COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  yellow: "bg-amber-100 text-amber-800 border-amber-200",
  purple: "bg-violet-100 text-violet-800 border-violet-200",
  pink: "bg-pink-100 text-pink-800 border-pink-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  teal: "bg-teal-100 text-teal-800 border-teal-200",
}

function getTagClasses(color: string) {
  return TAG_COLORS[color] || "bg-secondary text-secondary-foreground border-border"
}

// ── Toolbar buttons ──────────────────────────────────────────────────────────

interface ToolbarAction {
  icon: typeof Bold
  label: string
  shortcut: string
  prefix: string
  suffix: string
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: Bold, label: "Bold", shortcut: "Cmd+B", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italic", shortcut: "Cmd+I", prefix: "*", suffix: "*" },
  { icon: Heading, label: "Heading", shortcut: "Cmd+H", prefix: "## ", suffix: "" },
  { icon: LinkIcon, label: "Link", shortcut: "Cmd+K", prefix: "[", suffix: "](url)" },
  { icon: List, label: "List", shortcut: "", prefix: "- ", suffix: "" },
  { icon: Code, label: "Code Block", shortcut: "", prefix: "```\n", suffix: "\n```" },
  { icon: ImageIcon, label: "Image", shortcut: "", prefix: "![alt](", suffix: ")" },
]

// ── Title max length ─────────────────────────────────────────────────────────

const TITLE_MAX_LENGTH = 200

// ── Component ────────────────────────────────────────────────────────────────

export function MarkdownEditor({ initialData, isNew = false }: MarkdownEditorProps) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  // State
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [content, setContent] = useState(initialData?.content ?? "")
  const [tags, setTags] = useState(initialData?.tags ?? [])
  const [showPreview, setShowPreview] = useState(true)
  const [showMetadata, setShowMetadata] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(isNew ? "unsaved" : "saved")
  const [tagSearch, setTagSearch] = useState("")
  const [showTagDropdown, setShowTagDropdown] = useState(false)

  const createdAt = initialData?.createdAt ?? new Date()
  const updatedAt = initialData?.updatedAt ?? new Date()
  const isIndexed = initialData?.isIndexed ?? false

  // Word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto"
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [title])

  // Autofocus title on new notes
  useEffect(() => {
    if (isNew && titleRef.current) {
      titleRef.current.focus()
    }
  }, [isNew])

  // ── Simulated save ───────────────────────────────────────────────────────

  const simulateSave = useCallback(() => {
    setSaveStatus("saving")
    console.log("Saving note:", { title, content, tags })
    setTimeout(() => {
      setSaveStatus("saved")
    }, 800)
  }, [title, content, tags])

  // Auto-save (debounced: 2s after last edit)
  const debouncedSave = useDebouncedCallback(() => {
    if (title.trim() || content.trim()) {
      simulateSave()
    }
  }, 2000)

  const handleTitleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value.slice(0, TITLE_MAX_LENGTH)
      setTitle(value)
      if (saveStatus === "saved") setSaveStatus("unsaved")
      debouncedSave()
    },
    [debouncedSave, saveStatus]
  )

  const handleContentChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value)
      if (saveStatus === "saved") setSaveStatus("unsaved")
      debouncedSave()
    },
    [debouncedSave, saveStatus]
  )

  // ── Markdown insertion ───────────────────────────────────────────────────

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = content.slice(start, end)
      const replacement = `${prefix}${selectedText || "text"}${suffix}`

      const newContent =
        content.slice(0, start) + replacement + content.slice(end)
      setContent(newContent)

      // Position cursor
      requestAnimationFrame(() => {
        textarea.focus()
        const cursorPos = selectedText
          ? start + replacement.length
          : start + prefix.length + 4 // "text" length
        textarea.setSelectionRange(cursorPos, cursorPos)
      })

      if (saveStatus === "saved") setSaveStatus("unsaved")
      debouncedSave()
    },
    [content, debouncedSave, saveStatus]
  )

  // ── Keyboard shortcuts ───────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const isMac =
        typeof navigator !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      // Tab inserts 2 spaces
      if (e.key === "Tab") {
        e.preventDefault()
        const textarea = textareaRef.current
        if (!textarea) return
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent = content.slice(0, start) + "  " + content.slice(end)
        setContent(newContent)
        requestAnimationFrame(() => {
          textarea.setSelectionRange(start + 2, start + 2)
        })
        return
      }

      if (modifier && e.key === "b") {
        e.preventDefault()
        insertMarkdown("**", "**")
      } else if (modifier && e.key === "i") {
        e.preventDefault()
        insertMarkdown("*", "*")
      } else if (modifier && e.key === "k") {
        e.preventDefault()
        insertMarkdown("[", "](url)")
      } else if (modifier && e.key === "h") {
        e.preventDefault()
        insertMarkdown("## ", "")
      } else if (modifier && e.key === "s") {
        e.preventDefault()
        simulateSave()
      } else if (modifier && e.key === "Enter") {
        e.preventDefault()
        simulateSave()
        setTimeout(() => router.push("/notes"), 900)
      }
    },
    [content, insertMarkdown, simulateSave, router]
  )

  // Global escape handler
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        const hasChanges = saveStatus === "unsaved"
        if (hasChanges) {
          if (confirm("Discard unsaved changes?")) {
            router.push("/notes")
          }
        } else {
          router.push("/notes")
        }
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [router, saveStatus])

  // ── Tag management ───────────────────────────────────────────────────────

  const filteredTags = AVAILABLE_TAGS.filter(
    (t) =>
      !tags.some((existing) => existing.id === t.id) &&
      t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )

  const addTag = useCallback(
    (tag: (typeof AVAILABLE_TAGS)[0]) => {
      setTags((prev) => [...prev, tag])
      setTagSearch("")
      setShowTagDropdown(false)
      if (saveStatus === "saved") setSaveStatus("unsaved")
      debouncedSave()
    },
    [debouncedSave, saveStatus]
  )

  const removeTag = useCallback(
    (tagId: string) => {
      setTags((prev) => prev.filter((t) => t.id !== tagId))
      if (saveStatus === "saved") setSaveStatus("unsaved")
      debouncedSave()
    },
    [debouncedSave, saveStatus]
  )

  // ── Action handlers ──────────────────────────────────────────────────────

  const handleSave = () => simulateSave()

  const handleSaveAndClose = () => {
    simulateSave()
    setTimeout(() => router.push("/notes"), 900)
  }

  const handleCancel = () => {
    const hasChanges = saveStatus === "unsaved"
    if (hasChanges) {
      if (confirm("Discard unsaved changes?")) {
        router.push("/notes")
      }
    } else {
      router.push("/notes")
    }
  }

  // ── Save status indicator ────────────────────────────────────────────────

  const SaveIndicator = () => {
    switch (saveStatus) {
      case "saved":
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Saved
          </span>
        )
      case "saving":
        return (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
          </span>
        )
      case "draft":
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" /> Draft saved locally
          </span>
        )
      case "unsaved":
        return (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Unsaved changes
          </span>
        )
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-screen flex-col bg-background">
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-card/80 px-4 py-2.5 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => router.push("/notes")}
              aria-label="Back to notes"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <SaveIndicator />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="sm" onClick={handleSave}>
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <kbd className="text-[10px] font-mono">Cmd+S</kbd>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={handleSaveAndClose}>
                  {"Save & Close"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <kbd className="text-[10px] font-mono">Cmd+Enter</kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* ── Title input ──────────────────────────────────────────────────── */}
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
          <textarea
            ref={titleRef}
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            rows={1}
            className="w-full resize-none overflow-hidden bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            aria-label="Note title"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {title.length}/{TITLE_MAX_LENGTH} characters
          </p>
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="sticky top-[53px] z-20 border-b bg-card/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-1.5 sm:px-6">
            <div className="flex items-center gap-0.5 overflow-x-auto">
              {TOOLBAR_ACTIONS.map((action) => (
                <Tooltip key={action.label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => insertMarkdown(action.prefix, action.suffix)}
                      aria-label={action.label}
                    >
                      <action.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {action.label}
                    {action.shortcut && (
                      <kbd className="ml-2 text-[10px] font-mono text-muted-foreground">
                        {action.shortcut}
                      </kbd>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPreview((v) => !v)}
                  aria-label={showPreview ? "Hide preview" : "Show preview"}
                >
                  {showPreview ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline text-xs">
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Toggle live preview
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ── Split pane (editor + preview) ────────────────────────────────── */}
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6 md:flex-row md:gap-0">
          {/* Editor pane */}
          <div
            className={cn(
              "flex flex-col",
              showPreview ? "md:w-1/2 md:border-r md:pr-4" : "w-full"
            )}
          >
            <label htmlFor="markdown-editor" className="sr-only">
              Markdown content
            </label>
            <textarea
              ref={textareaRef}
              id="markdown-editor"
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Start writing your note in markdown..."
              className="min-h-[400px] flex-1 resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              spellCheck
            />
          </div>

          {/* Preview pane */}
          {showPreview && (
            <div className="mt-4 border-t pt-4 md:mt-0 md:w-1/2 md:border-t-0 md:pl-4 md:pt-0">
              <div className="mb-2 flex items-center gap-2 md:mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Preview
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="overflow-y-auto">
                <MarkdownPreview content={content} />
              </div>
            </div>
          )}
        </main>

        {/* ── Bottom metadata panel ────────────────────────────────────────── */}
        <div className="border-t bg-card/60">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:bg-accent/40 transition-colors sm:px-6"
            onClick={() => setShowMetadata((v) => !v)}
            aria-expanded={showMetadata}
            aria-controls="metadata-panel"
          >
            <div className="flex items-center gap-4">
              <span>{wordCount} words</span>
              <span className="hidden sm:inline">
                {tags.length} tag{tags.length !== 1 ? "s" : ""}
              </span>
              <span className="hidden sm:inline">
                {isIndexed ? "Indexed" : "Pending indexing"}
              </span>
            </div>
            {showMetadata ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>

          {showMetadata && (
            <div id="metadata-panel" className="border-t px-4 py-4 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Tags */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Tags
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          getTagClasses(tag.color)
                        )}
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => removeTag(tag.id)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                          aria-label={`Remove ${tag.name} tag`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <Input
                      value={tagSearch}
                      onChange={(e) => {
                        setTagSearch(e.target.value)
                        setShowTagDropdown(true)
                      }}
                      onFocus={() => setShowTagDropdown(true)}
                      onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                      placeholder="Search tags..."
                      className="h-8 text-xs"
                      aria-label="Search tags"
                    />
                    {showTagDropdown && filteredTags.length > 0 && (
                      <div className="absolute top-full left-0 z-10 mt-1 w-full rounded-md border bg-card p-1 shadow-md">
                        {filteredTags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent transition-colors text-foreground"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              addTag(tag)
                            }}
                          >
                            <span
                              className={cn(
                                "h-2.5 w-2.5 rounded-full border",
                                getTagClasses(tag.color)
                              )}
                            />
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Created */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Created
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(createdAt, { addSuffix: true })}
                  </p>
                </div>

                {/* Modified */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Modified
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(updatedAt, { addSuffix: true })}
                  </p>
                </div>

                {/* Indexing */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Indexing
                  </label>
                  <Badge
                    variant={isIndexed ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px]",
                      isIndexed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    )}
                  >
                    {isIndexed ? "Indexed" : "Pending"}
                  </Badge>
                </div>

                {/* Word count */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Word Count
                  </label>
                  <p className="text-xs text-muted-foreground tabular-nums">{wordCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
