import { Suspense } from "react"
import Link from "next/link"
import { Brain, Settings, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotesView } from "@/components/notes/notes-grid"

export const metadata = {
  title: "All Notes - Personal Vault",
  description: "Browse and manage all your notes in Personal Vault.",
}

export default function NotesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header - consistent with dashboard */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Back to dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Brain className="h-4 w-4" aria-hidden="true" />
              </div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">All Notes</h1>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex text-[11px]">
              12 notes
            </Badge>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl">
        <Suspense
          fallback={
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-full rounded bg-muted animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
                      <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <NotesView />
        </Suspense>
      </main>
    </div>
  )
}
