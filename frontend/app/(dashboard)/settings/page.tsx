"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/dashboard/page-header"
import { ConnectionSettings } from "@/components/settings/connection-settings"
import { ImportExportSettings } from "@/components/settings/import-export-settings"
import { AdvancedSettings } from "@/components/settings/advanced-settings"
import { AboutSection } from "@/components/settings/about-section"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("connection")

  return (
    <div className="min-h-screen bg-background">
      {/* Header - consistent with dashboard */}
      <PageHeader
        title="Settings"
        icon={Settings}
        showBackButton
        maxWidth="6xl"
      />

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="space-y-4">
          {/* Description */}
          <p className="text-sm text-muted-foreground">
            Manage your Personal Vault configuration
          </p>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="import-export">Import/Export</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="mt-6">
              <ConnectionSettings />
            </TabsContent>

            <TabsContent value="import-export" className="mt-6">
              <ImportExportSettings />
            </TabsContent>

            <TabsContent value="advanced" className="mt-6">
              <AdvancedSettings />
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <AboutSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
