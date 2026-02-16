"use client"

import { Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SearchMode = "text" | "semantic"

interface ModeToggleProps {
  mode: SearchMode
  onModeChange: (mode: SearchMode) => void
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-secondary p-1" role="radiogroup" aria-label="Search mode">
      <button
        role="radio"
        aria-checked={mode === "text"}
        onClick={() => onModeChange("text")}
        title="Fast exact word matching"
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
          mode === "text"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Zap className="h-4 w-4" aria-hidden="true" />
        Text Search
      </button>
      <button
        role="radio"
        aria-checked={mode === "semantic"}
        onClick={() => onModeChange("semantic")}
        title="AI-powered meaning search"
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
          mode === "semantic"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Semantic Search
      </button>
    </div>
  )
}
