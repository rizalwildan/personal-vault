"use client"

import { useState } from "react"
import { Upload, Download, RefreshCw, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

export function ImportExportSettings() {
  const [exportFormat, setExportFormat] = useState("markdown")
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isReindexing, setIsReindexing] = useState(false)
  const { toast } = useToast()

  // Mock data for last import/index
  const [lastImport, setLastImport] = useState<{
    date: Date
    count: number
  } | null>({
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    count: 47,
  })

  const [lastIndexed, setLastIndexed] = useState<Date>(
    new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 hours ago
  )

  const handleImport = () => {
    setIsImporting(true)

    // Simulate file picker and import
    setTimeout(() => {
      const importCount = Math.floor(Math.random() * 20) + 5

      setLastImport({
        date: new Date(),
        count: importCount,
      })

      toast({
        title: "Import successful",
        description: `Imported ${importCount} notes from directory`,
      })

      setIsImporting(false)
      console.log("Import from directory triggered")
    }, 2000)
  }

  const handleExport = () => {
    setIsExporting(true)

    // Simulate export
    setTimeout(() => {
      toast({
        title: "Export successful",
        description: `Notes exported as ${exportFormat}`,
      })

      setIsExporting(false)
      console.log(`Export all notes as ${exportFormat}`)
    }, 1500)
  }

  const handleReindex = () => {
    setIsReindexing(true)

    // Simulate re-indexing
    setTimeout(() => {
      setLastIndexed(new Date())

      toast({
        title: "Re-indexing complete",
        description: "All notes have been re-indexed for semantic search",
      })

      setIsReindexing(false)
      console.log("Re-index all notes triggered")
    }, 3000)
  }

  return (
    <div className="space-y-6">
      {/* Import Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Import Notes</CardTitle>
          <CardDescription>
            Import markdown files from your local filesystem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import from Directory
            </Button>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">
                Import markdown files from a local folder
              </p>
              {lastImport && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Last import:
                  </span>{" "}
                  {lastImport.count} notes •{" "}
                  {formatDistanceToNow(lastImport.date, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Export Notes</CardTitle>
          <CardDescription>
            Download all your notes in various formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Markdown (.md)</span>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>JSON (.json)</span>
                  </div>
                </SelectItem>
                <SelectItem value="zip">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>ZIP archive</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export All Notes
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Download all your notes in the selected format
          </p>
        </CardContent>
      </Card>

      {/* Manual Re-indexing */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Re-indexing</CardTitle>
          <CardDescription>
            Regenerate vector embeddings for semantic search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This may take a few minutes for large collections
            </AlertDescription>
          </Alert>

          <div className="flex items-start gap-4">
            <Button
              variant="secondary"
              onClick={handleReindex}
              disabled={isReindexing}
              className="gap-2"
            >
              {isReindexing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Re-index All Notes
            </Button>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">
                Regenerate embeddings for all notes in your collection
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Last indexed:
                </span>{" "}
                {formatDistanceToNow(lastIndexed, { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
