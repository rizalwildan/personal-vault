# Project Brief: BMad-Personal-Vault (MCP Knowledge Base)

**Status:** Inception / Discovery  
**Author:** Mary (Analyst - BMad Team)  
**Date:** February 2025

---

## 1. Executive Summary

[cite_start]Membangun ekosistem _Knowledge Management_ pribadi yang memungkinkan _solo developer_ untuk memanggil catatan teknis, konvensi koding, dan dokumentasi pembelajaran secara "on-demand" langsung di dalam chat panel IDE (Cursor/VS Code) menggunakan protokol **MCP (Model Context Protocol)**[cite: 466, 475].

## 2. Problem Statement

AI generatif di IDE seringkali memberikan saran yang terlalu umum. Tanpa akses ke "otak eksternal" developer, AI tidak mengetahui:

- Konvensi penamaan (_naming convention_) spesifik yang disukai.
- Implementasi arsitektur (misal: _Clean Architecture_ versi personal).
- Solusi atas _error_ yang pernah dihadapi dan dicatat sebelumnya.

## 3. Solution Overview

Sistem ini akan berfungsi sebagai **Single Source of Truth** yang terdiri dari:

- **Web Dashboard:** Antarmuka berbasis web untuk mengelola (CRUD) catatan teks/markdown secara terpusat.
- **Vector Engine:** Mesin pengindeks yang memproses catatan agar dapat dicari secara semantik oleh AI.
- **MCP Server:** Jembatan komunikasi yang memungkinkan AI di IDE untuk melakukan kueri ke database catatan hanya saat dipanggil dengan perintah `@knowledge-base`.

## 4. Technical Constraints & Preferences

- **Deployment:** Docker Compose untuk kemudahan transisi dari lokal ke Cloud VPS.
- **Interaction Model:** **Reaktif** (AI hanya mengakses data saat diminta secara eksplisit oleh user).
- **Format Catatan:** _Plain Text_ atau _Markdown_ yang tersusun dalam direktori.
- **Tech Stack (POC Recommendation):**
  - Frontend: Next.js (Dashboard)
  - Database: PostgreSQL + PGVector atau ChromaDB
  - Protocol: MCP (Model Context Protocol SDK)

## 5. Success Criteria

- Developer dapat mengunggah catatan baru melalui dashboard dan segera tersedia untuk dipanggil di IDE.
- AI mampu memberikan jawaban teknis yang selaras dengan catatan yang ada di dashboard saat menggunakan perintah `@knowledge-base`.

## 6. Next Steps (BMad Workflow)

1. [cite_start]**PM Phase:** Transformasi ke Agent PM (John) untuk menyusun PRD detail dan User Stories.
2. [cite_start]**Architect Phase:** Winston (Architect) akan merancang struktur folder Docker dan skema database[cite: 326].
3. [cite_start]**Implementation:** Mulai siklus pembangunan (SM -> Dev -> QA)[cite: 470].
