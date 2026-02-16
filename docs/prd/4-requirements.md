# 4. Requirements

## 4.1 Functional Requirements (FR)

- **FR1: Web Management Dashboard:** Antarmuka berbasis web untuk operasi CRUD pada catatan teks/Markdown.
- **FR2: Local Directory Sync:** Kemampuan untuk memindai folder lokal dan mengimpor file catatan secara otomatis ke database.
- **FR3: Semantic Search Engine:** Implementasi pencarian berbasis makna menggunakan `pgvector` (PostgreSQL) untuk menemukan konteks paling relevan.
- **FR4: MCP Server Bridge:** Jembatan komunikasi yang mengekspos catatan sebagai _resource_ yang dapat dibaca oleh IDE (Cursor/VS Code/Claude Desktop).
- **FR5: Manual Re-indexing:** Tombol di dashboard untuk memperbarui _vector embeddings_ setelah ada perubahan pada catatan.

## 4.2 Non-Functional Requirements (NFR)

- **NFR1: Portability:** Deployment menggunakan Docker Compose (Local & Cloud ready).
- **NFR2: Performance:** Latensi pengambilan data melalui MCP harus < 2 detik.
- **NFR3: Data Privacy:** Sistem bersifat _self-hosted_; semua data tetap berada di infrastruktur milik user.
- **NFR4: Simple Security:** Implementasi API Key sederhana untuk mengamankan akses dari IDE ke server saat di-deploy di VPS.
