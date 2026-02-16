# Generate Full-Featured Markdown Editor with Live Preview

## High-Level Goal

Create a split-pane markdown editor with a toolbar, live preview, keyboard shortcuts, and auto-save indicator. The editor should feel like a professional writing tool with syntax highlighting and a distraction-free design.

## Detailed Step-by-Step Instructions

1. **Create the Editor Page Component**
   - File paths:
     - `app/(dashboard)/notes/[id]/edit/page.tsx` (edit existing note)
     - `app/(dashboard)/notes/new/page.tsx` (create new note)
   - Make it a Client Component ('use client')
   - Use TypeScript

2. **Build the Editor Layout Structure**
   - Full-height viewport layout (min-h-screen minus header)
   - Three sections:
     - Top bar: Title input + action buttons
     - Main area: Split pane (editor | preview)
     - Bottom bar: Metadata panel (collapsible)

3. **Create the Title Input Section**
   - Large text input: placeholder "Untitled Note", autofocus on new notes
   - Style: text-3xl, font-bold, border-none, focus:ring-0
   - Auto-resize height as user types
   - Display character count (200 max) below input (muted color)

4. **Build the Markdown Toolbar**
   - Fixed position below title, sticky top
   - Include buttons for:
     - **Bold** (Cmd+B) - Insert `**text**`
     - **Italic** (Cmd+I) - Insert `*text*`
     - **Heading** (Cmd+H) - Insert `## `
     - **Link** (Cmd+K) - Insert `[text](url)`
     - **List** - Insert `- `
     - **Code Block** - Insert triple backticks
     - **Image** (upload) - Insert `![alt](url)`
   - Each button shows tooltip on hover with shortcut hint
   - Use Lucide icons: Bold, Italic, Heading, Link, List, Code, Image

5. **Implement the Split-Pane Editor**
   - Left pane: Markdown input (textarea)
     - Use `<textarea>` with monospace font (Fira Code or JetBrains Mono fallback)
     - Min height: 400px, auto-expand
     - Tab key inserts 2 spaces (not focus change)
     - Line numbers (optional, use CSS counter)
   - Right pane: Live preview
     - Render markdown using `react-markdown` library
     - Apply prose styling (Tailwind typography plugin)
     - Sync scroll position with left pane (advanced, optional)
   - Divider: Resizable (optional) or fixed 50/50 split
   - Toggle preview on/off with button (icon: Eye/EyeOff)

6. **Add Keyboard Shortcuts**
   - Cmd+B / Ctrl+B: Bold
   - Cmd+I / Ctrl+I: Italic
   - Cmd+K / Ctrl+K: Insert link
   - Cmd+S / Ctrl+S: Save (prevent browser default)
   - Cmd+Enter / Ctrl+Enter: Save and close
   - Escape: Cancel and go back
   - Implement using `onKeyDown` event handler

7. **Build the Bottom Metadata Panel**
   - Collapsible panel (toggle with chevron icon)
   - Show when open:
     - Tags selector (multi-select input with autocomplete)
     - Created date (read-only, muted)
     - Modified date (read-only, muted)
     - Word count (live update)
     - Indexing status badge (Indexed / Pending / Failed)
   - Padding: p-4, border-top

8. **Implement Auto-Save Indicator**
   - Display in top-right corner
   - States:
     - "Saved" (green checkmark)
     - "Saving..." (spinner)
     - "Draft saved locally" (yellow warning icon, shown when offline)
   - Auto-save every 30 seconds or 2 seconds after user stops typing (use debounce)
   - For this mockup, simulate with setTimeout and state changes

9. **Add Action Buttons (Top Bar)**
   - Left side: Back button (arrow-left icon) - goes to `/notes`
   - Right side:
     - "Cancel" button (secondary variant, discards changes with confirmation)
     - "Save" button (primary variant, Cmd+S hint)
     - "Save & Close" button (primary variant, Cmd+Enter hint)

10. **Implement Responsive Design**
    - Mobile (< 768px):
      - Stacked layout (editor on top, preview below)
      - Hide preview by default, show with toggle button
      - Full-screen mode
    - Tablet/Desktop:
      - Side-by-side split pane (50/50)
      - Toggle-able preview panel
    - Use Tailwind breakpoints: md:flex-row, md:grid-cols-2

11. **Add Loading and Error States**
    - Loading: Skeleton for toolbar and editor area
    - Error: Show error message in place of editor with retry button

## Code Examples, Data Structures & Constraints

### Note Data Structure:

```typescript
interface NoteEditorData {
  id?: string; // undefined for new notes
  title: string;
  content: string; // Markdown
  tags: { id: string; name: string; color: string }[];
  createdAt?: Date;
  updatedAt?: Date;
  wordCount: number;
  isIndexed: boolean;
}
```

### Toolbar Button Example:

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => insertMarkdown('**', '**')}
  title="Bold (Cmd+B)"
  aria-label="Bold text"
>
  <Bold className="w-4 h-4" />
</Button>
```

### Keyboard Shortcut Handler Pattern:

```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? e.metaKey : e.ctrlKey;

  if (modifier && e.key === 'b') {
    e.preventDefault();
    insertMarkdown('**', '**');
  } else if (modifier && e.key === 's') {
    e.preventDefault();
    handleSave();
  }
  // ... more shortcuts
};
```

### Markdown Preview with react-markdown:

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

<div className="prose prose-slate dark:prose-invert max-w-none p-6">
  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
    {content}
  </ReactMarkdown>
</div>;
```

### Required Dependencies:

```json
{
  "react-markdown": "^9.0.0",
  "remark-gfm": "^4.0.0",
  "rehype-sanitize": "^6.0.0",
  "date-fns": "^3.0.0"
}
```

### Constraints - DO NOT:

- Do NOT implement actual file upload (show console.log only)
- Do NOT fetch real note data (use mock data or URL params)
- Do NOT implement real auto-save API calls (simulate with setTimeout)
- Do NOT add complex markdown extensions (code syntax highlighting, math)
- Do NOT use heavy WYSIWYG editors (CodeMirror, Monaco) - keep it simple with textarea

## Define Strict Scope

**Files to Create:**

- `app/(dashboard)/notes/[id]/edit/page.tsx` (edit note page)
- `app/(dashboard)/notes/new/page.tsx` (create new note page)
- `components/notes/markdown-editor.tsx` (editor component with toolbar)
- `components/notes/markdown-preview.tsx` (preview pane)
- `hooks/use-debounce.ts` (debounce hook for auto-save)

**Files NOT to Modify:**

- Do NOT alter shadcn/ui components
- Do NOT modify routing configuration
- Do NOT touch API routes yet (mock save function)

**Functionality Scope:**

- ONLY build UI with mock save/cancel actions (console.log)
- DO implement toolbar actions that insert markdown syntax
- DO implement keyboard shortcuts
- DO show auto-save indicator with simulated states
- DO NOT implement real file uploads or API persistence

**Accessibility Requirements:**

- Toolbar buttons must have aria-label and title attributes
- Textarea must have proper label (use sr-only class)
- Keyboard shortcuts must not conflict with browser defaults
- Focus must be visible on all interactive elements

**Design Guidelines:**

- Follow "Content is King" - editor should be distraction-free
- Use monospace font for editor (Fira Code, JetBrains Mono, Consolas)
- Use prose styles for preview (Tailwind typography)
- Keep toolbar minimal and unobtrusive (small icons, muted colors)
- Ensure fast performance (no lag when typing)

---

**Expected Output:**
A professional markdown editor with live preview, toolbar, keyboard shortcuts, and auto-save indicator. Clean design optimized for writing. Ready for API integration with TanStack Mutation for save operations.
