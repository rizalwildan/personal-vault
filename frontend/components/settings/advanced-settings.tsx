"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Trash2, RotateCcw, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface AdvancedFormData {
  embeddingModel: string
  batchSize: number
  cacheSizeMb: number
}

export function AdvancedSettings() {
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | null>(null)
  const { toast } = useToast()

  const { register, watch, setValue } = useForm<AdvancedFormData>({
    defaultValues: {
      embeddingModel: "paraphrase-multilingual-MiniLM-L12-v2",
      batchSize: 10,
      cacheSizeMb: 100,
    },
  })

  const formValues = watch()

  // Auto-save with debounce
  useEffect(() => {
    setSaveStatus("saving")
    const timeoutId = setTimeout(() => {
      console.log("Auto-saving advanced settings:", formValues)
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus(null), 2000)
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [formValues])

  const handleClearAllData = () => {
    console.log("Clear all data confirmed")
    setShowClearDialog(false)
    toast({
      title: "All data cleared",
      description: "All notes and settings have been removed",
      variant: "destructive",
    })
  }

  const handleResetToDefaults = () => {
    console.log("Reset to defaults confirmed")
    setValue("embeddingModel", "paraphrase-multilingual-MiniLM-L12-v2")
    setValue("batchSize", 10)
    setValue("cacheSizeMb", 100)
    setShowResetDialog(false)
    toast({
      title: "Settings reset",
      description: "All settings have been restored to defaults",
    })
  }

  return (
    <div className="space-y-6">
      {/* Embedding Model */}
      <Card>
        <CardHeader>
          <CardTitle>Embedding Model</CardTitle>
          <CardDescription>
            Select the model used for generating semantic search embeddings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="embedding-model">Model</Label>
            <Select
              value={formValues.embeddingModel}
              onValueChange={(value) => setValue("embeddingModel", value)}
            >
              <SelectTrigger id="embedding-model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paraphrase-multilingual-MiniLM-L12-v2">
                  paraphrase-multilingual-MiniLM-L12-v2
                </SelectItem>
                <SelectItem value="all-MiniLM-L6-v2">
                  all-MiniLM-L6-v2
                </SelectItem>
                <SelectItem value="all-mpnet-base-v2">
                  all-mpnet-base-v2
                </SelectItem>
                <SelectItem value="multi-qa-MiniLM-L6-cos-v1">
                  multi-qa-MiniLM-L6-cos-v1
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Model used for semantic search. Changing this will require
              re-indexing.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Settings</CardTitle>
          <CardDescription>
            Configure settings that affect application performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="batch-size">Batch Size</Label>
            <Input
              id="batch-size"
              type="number"
              min="1"
              max="100"
              {...register("batchSize", {
                valueAsNumber: true,
                min: 1,
                max: 100,
              })}
            />
            <p className="text-sm text-muted-foreground">
              Number of notes to process in parallel (1-100)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cache-size">Cache Size (MB)</Label>
            <Input
              id="cache-size"
              type="number"
              min="10"
              max="1000"
              {...register("cacheSizeMb", {
                valueAsNumber: true,
                min: 10,
                max: 1000,
              })}
            />
            <p className="text-sm text-muted-foreground">
              Maximum cache size for embeddings and search results (10-1000 MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            These actions cannot be undone. Please be careful.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="destructive"
              onClick={() => setShowClearDialog(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setShowResetDialog(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Status Indicator */}
      {saveStatus && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saveStatus === "saving" ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-green-600">Saved</span>
            </>
          )}
        </div>
      )}

      {/* Clear All Data Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              your notes, embeddings, and configuration data from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset to Defaults Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore all settings to their default values. Your
              notes and data will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetToDefaults}>
              Reset Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
