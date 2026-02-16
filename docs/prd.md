# Product Requirements Document: BMad-Personal-Vault (MCP Knowledge Base)

**Status:** Draft / Ready for Architecture Review  
**Author:** John (Product Manager - BMad Team)  
**Date:** Februari 2025

---

## 1. Goals (Tujuan)

- **Context Injection:** Memberikan instruksi spesifik, standar koding, dan dokumentasi teknis ke AI secara instan melalui perintah `@knowledge-base`.
- **Knowledge Persistence:** Menjamin solusi atas bug sulit dan hasil pembelajaran tersimpan secara permanen sebagai _Single Source of Truth_.
- **Consistency:** Memastikan AI menghasilkan kode yang seragam sesuai dengan _style_ personal developer (misal: Clean Architecture, Naming Convention).
- **Low Friction:** Memungkinkan pengelolaan catatan melalui dashboard web yang intuitif tanpa mengganggu alur kerja koding di IDE.

## 2. Background & Context

Sebagai _solo developer_, AI generatif seringkali memberikan saran yang terlalu umum. Proyek ini memecahkan masalah tersebut dengan menyediakan "otak eksternal" yang terhubung langsung ke IDE melalui protokol **MCP (Model Context Protocol)**, sehingga AI memiliki akses ke pengetahuan spesifik yang dimiliki developer.

## 3. User Stories

- **As a Developer**, I want to call `@knowledge-base` in my IDE, so that the AI uses my personal technical notes as its primary context for generating code.
- **As a Developer**, I want to manage my notes via a web dashboard, so that I can easily add, edit, or delete knowledge as I learn new things.
- **As a Developer**, I want the system to run in Docker, so that I can easily move my environment from local to a Cloud VPS.

## 4. Requirements

### 4.1 Functional Requirements (FR)

- **FR1: Web Management Dashboard:** Antarmuka berbasis web untuk operasi CRUD pada catatan teks/Markdown.
- **FR2: Local Directory Sync:** Kemampuan untuk memindai folder lokal dan mengimpor file catatan secara otomatis ke database.
- **FR3: Semantic Search Engine:** Implementasi pencarian berbasis makna menggunakan `pgvector` (PostgreSQL) untuk menemukan konteks paling relevan.
- **FR4: MCP Server Bridge:** Jembatan komunikasi yang mengekspos catatan sebagai _resource_ yang dapat dibaca oleh IDE (Cursor/VS Code/Claude Desktop).
- **FR5: Manual Re-indexing:** Tombol di dashboard untuk memperbarui _vector embeddings_ setelah ada perubahan pada catatan.

### 4.2 Non-Functional Requirements (NFR)

- **NFR1: Portability:** Deployment menggunakan Docker Compose (Local & Cloud ready).
- **NFR2: Performance:** Latensi pengambilan data melalui MCP harus < 2 detik.
- **NFR3: Data Privacy:** Sistem bersifat _self-hosted_; semua data tetap berada di infrastruktur milik user.
- **NFR4: Simple Security:** Implementasi API Key sederhana untuk mengamankan akses dari IDE ke server saat di-deploy di VPS.

## 5. Technical Stack (MVP/POC)

- **Frontend:** Next.js (App Router) + Tailwind CSS + shadcn/ui.
- **Database:** PostgreSQL dengan ekstensi `pgvector`.
- **MCP Layer:** Node.js dengan MCP SDK for TypeScript.
- **Containerization:** Docker & Docker Compose.
- **Embedding Model:** `all-MiniLM-L6-v2` (Local via Transformers.js) atau OpenAI API.

## 6. Roadmap & Success Criteria

### Roadmap:

1. **Fase 1 (Foundation):** Setup Docker (Postgres + pgvector) & Inisialisasi Project.
2. **Fase 2 (The Curator):** Pembangunan Dashboard CRUD & Editor Markdown.
3. **Fase 3 (The Bridge):** Implementasi MCP Server & Integrasi ke IDE.
4. **Fase 4 (Deployment):** Pengetesan di Cloud VPS & Optimasi Prompt.

### Success Criteria:

- Developer bisa memanggil `@knowledge-base` di IDE dan mendapatkan jawaban yang akurat berdasarkan catatan di dashboard.
- Sistem dapat di-deploy di lingkungan manapun hanya dengan `docker-compose up`.
