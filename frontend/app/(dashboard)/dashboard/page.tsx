import { Suspense } from "react"
import { Brain, Search, Plus, Upload, Settings, Server, FileText, RefreshCw, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { StatsCard, StatusDot, ProgressBar } from "@/components/dashboard/stats-card"
import { RecentNotes } from "@/components/dashboard/recent-notes"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

// ── Mock data ───────────────────────────────────────────────────────────────

const mockNotes = [
  { id: "1", title: "Getting started with the MCP protocol for knowledge management", updatedAt: new Date(Date.now() - 1000 * 60 * 25) },
  { id: "2", title: "Meeting notes: Q1 product roadmap review session", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: "3", title: "TypeScript best practices and design patterns", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5) },
  { id: "4", title: "Personal goals and weekly habit tracker for February", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  { id: "5", title: "Research: vector embeddings for semantic search", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
]

const mockStats = {
  mcpStatus: "connected" as const,
  totalNotes: 142,
  lastSync: new Date(Date.now() - 1000 * 60 * 3),
  dbHealth: 98,
}

// ── Skeleton loaders ────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-7 w-24 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function NotesSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 pb-3">
        <div className="h-5 w-28 rounded bg-muted animate-pulse" />
      </div>
      <div className="px-2 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-48 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard page ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Personal Vault</h1>
            <Badge
              variant={mockStats.mcpStatus === "connected" ? "default" : "destructive"}
              className="ml-1 hidden sm:inline-flex"
            >
              <StatusDot status={mockStats.mcpStatus} />
              <span className="ml-1.5 capitalize">{mockStats.mcpStatus}</span>
            </Badge>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-6">

          {/* Search bar */}
          <section aria-label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                placeholder="Search notes... (Cmd+K)"
                className="h-11 pl-10 pr-4"
                readOnly
                aria-label="Search notes"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {"Press Cmd+K or / to search from anywhere"}
            </p>
          </section>

          {/* Quick actions */}
          <section aria-label="Quick actions">
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-center">
                <div className="flex flex-col items-center gap-1.5">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    New Note
                  </Button>
                  <kbd className="text-[11px] text-muted-foreground font-mono">Cmd + N</kbd>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Import Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Stats grid + Recent notes in two-column layout on large screens */}
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:items-start">

            {/* System status panel */}
            <section aria-label="System status" className="lg:col-span-2">
              <Suspense fallback={<StatsSkeleton />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StatsCard title="MCP Server" icon={Server}>
                    <div className="flex items-center gap-2">
                      <StatusDot status={mockStats.mcpStatus} />
                      <span className="text-sm font-semibold text-foreground capitalize">
                        {mockStats.mcpStatus}
                      </span>
                    </div>
                  </StatsCard>

                  <StatsCard title="Total Notes" icon={FileText}>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      {mockStats.totalNotes}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">notes</span>
                    </p>
                  </StatsCard>

                  <StatsCard title="Last Sync" icon={RefreshCw}>
                    <p className="text-sm font-semibold text-foreground">
                      {formatDistanceToNow(mockStats.lastSync, { addSuffix: true })}
                    </p>
                  </StatsCard>

                  <StatsCard title="Database Health" icon={Database}>
                    <div className="flex flex-col gap-2">
                      <p className="text-2xl font-bold text-foreground tabular-nums">
                        {mockStats.dbHealth}%
                      </p>
                      <ProgressBar value={mockStats.dbHealth} />
                    </div>
                  </StatsCard>
                </div>
              </Suspense>
            </section>

            {/* Recent notes */}
            <section aria-label="Recent notes" className="lg:col-span-3">
              <Suspense fallback={<NotesSkeleton />}>
                <RecentNotes notes={mockNotes} />
              </Suspense>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
