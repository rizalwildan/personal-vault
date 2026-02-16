"use client"

import { use } from "react"
import { MarkdownEditor } from "@/components/notes/markdown-editor"

// ── Mock data for editing ────────────────────────────────────────────────────

const MOCK_NOTES: Record<
  string,
  {
    title: string
    content: string
    tags: { id: string; name: string; color: string }[]
    createdAt: Date
    updatedAt: Date
    isIndexed: boolean
  }
> = {
  "1": {
    title: "Getting Started with the MCP Protocol for Knowledge Management",
    content: `# MCP Protocol

The Model Context Protocol enables seamless communication between AI assistants and external tools. This guide covers setup, configuration, and best practices for integrating MCP into your knowledge management workflow.

## What is MCP?

MCP (Model Context Protocol) is an open protocol that standardizes how applications provide context to LLMs. It provides a way for AI models to access external data sources, tools, and prompts through a unified interface.

## Key Concepts

- **Servers** provide context, tools, and prompts to clients
- **Clients** connect to servers and make requests
- **Transports** handle the communication between clients and servers

## Getting Started

First, install the MCP SDK:

\`\`\`bash
npm install @modelcontextprotocol/sdk
\`\`\`

Then create a simple server:

\`\`\`typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "my-vault",
  version: "1.0.0"
});
\`\`\`

## Best Practices

1. Keep your server focused on a single domain
2. Use proper error handling
3. Validate all inputs
4. Document your tools and prompts`,
    tags: [
      { id: "t1", name: "MCP", color: "blue" },
      { id: "t2", name: "Tutorial", color: "green" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25),
    isIndexed: true,
  },
  "2": {
    title: "Meeting Notes: Q1 Product Roadmap Review Session",
    content: `## Key Decisions

- Prioritize search performance improvements
- Launch new tagging system in March
- Defer mobile app to Q2

## Action Items

- John will prepare the technical spec for vector search
- Sarah will finalize the tag taxonomy
- Team to review and approve by Friday

## Discussion Points

### Search Improvements
The current keyword search is not meeting user expectations. We agreed to implement **semantic search** using vector embeddings.

### Tagging System
Users have been requesting a more flexible tagging system with:
- Hierarchical tags
- Auto-suggestions
- Bulk tagging

### Mobile App
Deferred to Q2 due to resource constraints. Will revisit in the next planning session.`,
    tags: [
      { id: "t3", name: "Meeting Notes", color: "yellow" },
      { id: "t4", name: "Architecture", color: "purple" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isIndexed: true,
  },
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const noteData = MOCK_NOTES[id]

  if (!noteData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">Note not found</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {"The note you're looking for doesn't exist."}
          </p>
          <a
            href="/notes"
            className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Back to notes
          </a>
        </div>
      </div>
    )
  }

  return (
    <MarkdownEditor
      initialData={{
        id,
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags,
        createdAt: noteData.createdAt,
        updatedAt: noteData.updatedAt,
        wordCount: noteData.content.trim().split(/\s+/).length,
        isIndexed: noteData.isIndexed,
      }}
    />
  )
}
