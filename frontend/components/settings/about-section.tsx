"use client"

import { ExternalLink, Github, FileText, Database, Code, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function AboutSection() {
  const appVersion = "v1.0.0"
  const technologies = [
    { name: "Next.js", icon: Code, description: "React framework" },
    { name: "PostgreSQL", icon: Database, description: "Relational database" },
    { name: "pgvector", icon: Brain, description: "Vector similarity search" },
    { name: "TypeScript", icon: Code, description: "Type-safe JavaScript" },
    { name: "Tailwind CSS", icon: Code, description: "Utility-first CSS" },
    { name: "shadcn/ui", icon: Code, description: "Component library" },
  ]

  return (
    <div className="space-y-6">
      {/* App Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Personal Vault</CardTitle>
              <CardDescription className="mt-2">
                Self-hosted knowledge management system with MCP integration
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {appVersion}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Personal Vault is an open-source knowledge management system that
            integrates with the Model Context Protocol (MCP) for semantic
            search and intelligent note organization. Store, search, and manage
            your markdown notes with powerful vector-based similarity search.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a
                href="https://github.com/yourusername/personal-vault"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                GitHub Repository
                <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
              </a>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a
                href="https://docs.example.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="h-4 w-4" />
                Documentation
                <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
              </a>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a
                href="https://github.com/yourusername/personal-vault/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                Report an Issue
                <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
          <CardDescription>
            Built with modern, reliable technologies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {technologies.map((tech) => (
              <div key={tech.name} className="flex items-start gap-3">
                <div className="rounded-lg bg-muted p-2 mt-0.5">
                  <tech.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{tech.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {tech.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
          <CardDescription>
            Powerful tools for knowledge management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>
                <strong>Semantic Search:</strong> Find notes by meaning, not
                just keywords
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>
                <strong>MCP Integration:</strong> Connect with Model Context
                Protocol servers
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>
                <strong>Markdown Support:</strong> Write notes in markdown with
                live preview
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>
                <strong>Self-Hosted:</strong> Full control over your data and
                privacy
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>
                <strong>Import/Export:</strong> Easy data portability and
                backups
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* License and Credits */}
      <Card>
        <CardHeader>
          <CardTitle>License</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">
              <strong>MIT License</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Permission is hereby granted, free of charge, to any person
              obtaining a copy of this software and associated documentation
              files, to deal in the Software without restriction, including
              without limitation the rights to use, copy, modify, merge,
              publish, distribute, sublicense, and/or sell copies of the
              Software.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Credits</p>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ by the open-source community. Special thanks to all
              contributors and the maintainers of the technologies that make
              this project possible.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Version</dt>
              <dd className="mt-1">{appVersion}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Build Date</dt>
              <dd className="mt-1">February 2026</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Node Version</dt>
              <dd className="mt-1">v20.x</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Next.js</dt>
              <dd className="mt-1">16.1.6</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
