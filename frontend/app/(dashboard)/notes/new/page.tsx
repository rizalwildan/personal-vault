import { MarkdownEditor } from "@/components/notes/markdown-editor"

export const metadata = {
  title: "New Note - Personal Vault",
  description: "Create a new note in your Personal Vault.",
}

export default function NewNotePage() {
  return <MarkdownEditor isNew />
}
