"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

// Form validation schema
const connectionSchema = z.object({
  mcpServerUrl: z
    .string()
    .min(1, "URL is required")
    .regex(/^https?:\/\/.+/, "Must be a valid URL"),
  apiKey: z.string().min(1, "API key is required"),
})

type ConnectionFormData = z.infer<typeof connectionSchema>

interface ConnectionStatus {
  status: "connected" | "disconnected"
  lastChecked: Date
}

export function ConnectionSettings() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "disconnected",
    lastChecked: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
  })
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | null>(null)
  const { toast } = useToast()

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      mcpServerUrl: "http://localhost:8000",
      apiKey: "",
    },
  })

  // Watch form changes for auto-save
  const formValues = watch()

  useEffect(() => {
    // Simulate auto-save with debounce
    setSaveStatus("saving")
    const timeoutId = setTimeout(() => {
      console.log("Auto-saving connection settings:", formValues)
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus(null), 2000)
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [formValues])

  const testConnection = async () => {
    setIsTestingConnection(true)

    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.3 // 70% success rate

      if (success) {
        setConnectionStatus({
          status: "connected",
          lastChecked: new Date(),
        })
        toast({
          title: "Connection successful",
          description: "Successfully connected to MCP server",
        })
      } else {
        setConnectionStatus({
          status: "disconnected",
          lastChecked: new Date(),
        })
        toast({
          title: "Connection failed",
          description: "Could not reach MCP server. Please check your settings.",
          variant: "destructive",
        })
      }

      setIsTestingConnection(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* MCP Server Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>MCP Server Configuration</CardTitle>
          <CardDescription>
            Configure the connection to your Model Context Protocol server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mcp-url">MCP Server URL</Label>
            <Input
              id="mcp-url"
              type="text"
              placeholder="http://localhost:8000"
              {...register("mcpServerUrl")}
            />
            {errors.mcpServerUrl && (
              <p className="text-sm text-destructive" aria-live="polite">
                {errors.mcpServerUrl.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              URL where your MCP server is running
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>API Authentication</CardTitle>
          <CardDescription>
            Secure your connection with API key authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your API key"
                className="pr-10"
                {...register("apiKey")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.apiKey && (
              <p className="text-sm text-destructive" aria-live="polite">
                {errors.apiKey.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              API key for authenticating requests to the MCP server
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            Monitor the health of your MCP server connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant={
                    connectionStatus.status === "connected"
                      ? "default"
                      : "destructive"
                  }
                  className="gap-1"
                >
                  {connectionStatus.status === "connected" ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {connectionStatus.status === "connected"
                    ? "Connected"
                    : "Disconnected"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Last checked:{" "}
                {formatDistanceToNow(connectionStatus.lastChecked, {
                  addSuffix: true,
                })}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={testConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Test Connection
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
    </div>
  )
}
