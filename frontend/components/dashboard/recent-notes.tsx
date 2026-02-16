"use client"

import Link from "next/link"
import { FileText } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface Note {
  id: string
  title: string
  updatedAt: Date
}

interface RecentNotesProps {
  notes: Note[]
}

function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + "..."
}

export function RecentNotes({ notes }: RecentNotesProps) {
  if (notes.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground">
              No notes yet. Create your first note!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Recent Notes</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <nav aria-label="Recent notes">
          <ul className="flex flex-col" role="list">
            {notes.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/notes/${note.id}`}
                  className="flex items-center justify-between gap-4 rounded-md px-4 py-3 transition-colors duration-150 ease-in-out hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate text-sm font-medium text-foreground">
                      {truncate(note.title, 50)}
                    </span>
                  </div>
                  <time
                    dateTime={note.updatedAt.toISOString()}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  )
}
