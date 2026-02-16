# Generate Settings Page with Multi-Tab Interface

## High-Level Goal
Create a comprehensive settings page with tab navigation for Connection Settings, Import/Export, Advanced options, and About information. Include form inputs, status indicators, and danger zone actions.

## Detailed Step-by-Step Instructions

1. **Create the Settings Page Component**
   - File path: `app/(dashboard)/settings/page.tsx`
   - Make it a Client Component for interactive tabs and forms
   - Use TypeScript

2. **Build the Page Header**
   - Page title: "Settings" (text-3xl, font-bold)
   - Subtitle: "Manage your Personal Vault configuration"
   - Use semantic heading structure (h1 for title)

3. **Implement Tab Navigation**
   - Use shadcn/ui Tabs component
   - Tabs: "Connection", "Import/Export", "Advanced", "About"
   - Tab indicators: Underline for active tab (primary color)
   - Keyboard navigable: Arrow keys to switch tabs

4. **Build Connection Settings Tab**
   - Section: MCP Server Configuration
     - Label: "MCP Server URL"
     - Input field: text type, placeholder "http://localhost:8000"
     - Help text: "URL where your MCP server is running"
   - Section: API Authentication
     - Label: "API Key"
     - Input field: password type (masked), placeholder "Enter your API key"
     - Toggle button: Show/Hide password (Eye icon)
   - Section: Connection Status
     - Status indicator (Badge): "Connected" (green) or "Disconnected" (red)
     - Last checked timestamp: "Last checked: 2 minutes ago"
     - Button: "Test Connection" (secondary variant)
     - On click: Show loading spinner, then success/error message

5. **Build Import/Export Tab**
   - Section: Import Notes
     - Button: "Import from Directory" (primary variant, Upload icon)
     - Help text: "Import markdown files from a local folder"
     - Display: Last import date and count (if available)
   - Section: Export Notes
     - Button: "Export All Notes" (secondary variant, Download icon)
     - Format dropdown: "Markdown (.md)", "JSON (.json)", "ZIP archive"
     - Help text: "Download all your notes"
   - Section: Manual Re-indexing
     - Button: "Re-index All Notes" (secondary variant, RefreshCw icon)
     - Help text: "Regenerate vector embeddings for semantic search"
     - Display: Last indexed timestamp
     - Warning: "This may take a few minutes for large collections"

6. **Build Advanced Tab**
   - Section: Embedding Model
     - Dropdown: "paraphrase-multilingual-MiniLM-L12-v2" (selected), other options
     - Help text: "Model used for semantic search"
   - Section: Performance Settings
     - Number input: "Batch Size" (default: 10, range: 1-100)
     - Number input: "Cache Size (MB)" (default: 100, range: 10-1000)
     - Help text for each field
   - Section: Danger Zone (red border, red text)
     - Heading: "Danger Zone" (text-destructive, font-bold)
     - Button: "Clear All Data" (destructive variant)
       - Shows confirmation dialog: "Are you sure? This cannot be undone."
     - Button: "Reset to Defaults" (destructive variant, outline)

7. **Build About Tab**
   - Display:
     - App name: "Personal Vault"
     - Version: "v1.0.0"
     - Description: "Self-hosted knowledge management system with MCP integration"
   - Links (as buttons or links):
     - "Documentation" (opens docs in new tab)
     - "GitHub Repository" (opens GitHub in new tab)
     - "Report an Issue" (opens GitHub issues)
   - Credits section:
     - List of technologies used (Next.js, PostgreSQL, pgvector, etc.)
   - License: "MIT License"

8. **Implement Form Handling**
   - Use react-hook-form for form state
   - Validate inputs (required, URL format, etc.)
   - Show inline error messages below invalid fields
   - Auto-save changes 2 seconds after user stops typing (debounced)
   - Show save indicator: "Saved" (checkmark) or "Saving..." (spinner)

9. **Add Confirmation Dialogs**
   - For "Clear All Data" button: Show modal with title, description, Confirm/Cancel buttons
   - For "Test Connection" success: Show success toast notification
   - For "Test Connection" error: Show error toast with error message

10. **Implement Responsive Design**
    - Mobile: Tabs in dropdown/select instead of horizontal tabs
    - Tablet/Desktop: Horizontal tabs, wider form inputs
    - Use form grid: 1 column mobile, 2 columns desktop (for some fields)

11. **Add Loading and Empty States**
    - Loading: Skeleton for form fields while fetching settings
    - Empty state for Import/Export: "No imports yet" if user hasn't imported files

## Code Examples, Data Structures & Constraints

### Settings Data Structure:
```typescript
interface Settings {
  mcpServerUrl: string;
  apiKey: string;
  connectionStatus: 'connected' | 'disconnected';
  lastChecked: Date;
  embeddingModel: string;
  batchSize: number;
  cacheSizeMb: number;
  lastImport?: { date: Date; count: number };
  lastIndexed?: Date;
}
```

### Tab Component Example:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="connection" className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="connection">Connection</TabsTrigger>
    <TabsTrigger value="import-export">Import/Export</TabsTrigger>
    <TabsTrigger value="advanced">Advanced</TabsTrigger>
    <TabsTrigger value="about">About</TabsTrigger>
  </TabsList>

  <TabsContent value="connection">
    {/* Connection settings form */}
  </TabsContent>

  <TabsContent value="import-export">
    {/* Import/Export options */}
  </TabsContent>

  {/* ... other tabs */}
</Tabs>
```

### Form Field Example:
```tsx
<div className="space-y-2">
  <label htmlFor="mcp-url" className="text-sm font-medium">
    MCP Server URL
  </label>
  <input
    id="mcp-url"
    type="text"
    placeholder="http://localhost:8000"
    className="w-full px-3 py-2 border rounded-md"
    {...register('mcpServerUrl', {
      required: 'URL is required',
      pattern: {
        value: /^https?:\/\/.+/,
        message: 'Must be a valid URL',
      },
    })}
  />
  {errors.mcpServerUrl && (
    <p className="text-sm text-destructive">{errors.mcpServerUrl.message}</p>
  )}
  <p className="text-sm text-muted-foreground">
    URL where your MCP server is running
  </p>
</div>
```

### Danger Zone Section:
```tsx
<div className="border-2 border-destructive rounded-lg p-6 mt-8">
  <h3 className="text-lg font-bold text-destructive mb-4">Danger Zone</h3>
  <p className="text-sm text-muted-foreground mb-4">
    These actions cannot be undone. Please be careful.
  </p>
  <div className="flex flex-col gap-3">
    <Button
      variant="destructive"
      onClick={() => setShowClearDialog(true)}
    >
      <Trash2 className="w-4 h-4 mr-2" />
      Clear All Data
    </Button>
    <Button
      variant="outline"
      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      Reset to Defaults
    </Button>
  </div>
</div>
```

### Required Icons:
```typescript
import {
  Settings,
  Key,
  Upload,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  ExternalLink,
  CheckCircle,
  XCircle,
} from 'lucide-react';
```

### Constraints - DO NOT:
- Do NOT implement real API calls for saving settings (mock with console.log)
- Do NOT implement actual import/export functionality (show file picker only)
- Do NOT connect to real MCP server (simulate test connection with timeout)
- Do NOT implement actual "Clear All Data" (just show confirmation dialog)
- Do NOT use complex form libraries beyond react-hook-form

## Define Strict Scope

**Files to Create:**
- `app/(dashboard)/settings/page.tsx` (main settings page with tabs)
- `components/settings/connection-settings.tsx` (Connection tab content)
- `components/settings/import-export-settings.tsx` (Import/Export tab)
- `components/settings/advanced-settings.tsx` (Advanced tab)
- `components/settings/about-section.tsx` (About tab)

**Files NOT to Modify:**
- Do NOT alter shadcn/ui components
- Do NOT modify API routes (no backend yet)
- Do NOT touch database or authentication files

**Functionality Scope:**
- ONLY build UI with mock save actions (console.log or local state)
- DO implement form validation with react-hook-form
- DO implement tab navigation with keyboard support
- DO show confirmation dialogs for dangerous actions
- DO NOT implement real import/export, API saving, or MCP connection

**Accessibility Requirements:**
- All form fields must have associated labels (htmlFor/id)
- Tab navigation must support Arrow keys and Tab key
- Buttons must have aria-label for icon-only buttons
- Error messages must be associated with inputs (aria-describedby)
- Danger zone actions must have explicit confirmation steps

**Design Guidelines:**
- Use clear visual hierarchy (headings, spacing)
- Group related settings in sections with borders/backgrounds
- Use help text liberally to explain settings
- Make danger zone visually distinct (red border, warning colors)
- Auto-save settings seamlessly (no Save button except for danger actions)

---

**Expected Output:**
A comprehensive settings page with tabbed interface, form validation, status indicators, and danger zone. Clean, organized, and ready for backend API integration.