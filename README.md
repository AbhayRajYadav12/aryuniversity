# ARY University – Secure Digital Library

**Tagline:** Protecting Knowledge. Securing Access. Empowering Learning.

DRM-style PDF protection for a Computer Network Security (CNS) academic project. Runs entirely on your laptop with **no database** — JSON metadata, filesystem ciphertext, genuine **AES-256-GCM** encryption.

## Quick start

```bash
npm install
npm run seed
npm run dev
```

- Landing / app: **http://localhost:5180/**
- API: **http://localhost:4050**

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@university.edu` | `Admin@12345` |
| Student | `alice@university.edu` | `Student@12345` |
| Student | `bob@university.edu` | `Student@12345` |

## Highlights

- Public ARY University landing page
- Administrator portal: books, upload pipeline, students, permissions, **Encryption Center**, security monitoring, audit logs, testing lab
- Student portal: dashboard, explore, my books, history, profile, security info
- Secure PDF.js reader with **ARY UNIVERSITY – CONFIDENTIAL** personalized watermarks
- Live Security Testing Laboratory (8 real scenarios)

## Storage (database-free)

```
server/data/
  users.json, books.json, permissions.json, audit-logs.json, reading-history.json
  encrypted-books/     ← ciphertext (.pdf.enc)
  protected-keys/      ← wrapped DEKs
  temporary-processing/
```

Configure secrets in `server/.env` (`MASTER_KEY`, `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN`).

## Security testing

```bash
npm run security-test
```

Or Admin → Security Testing Lab → Run live tests.

## Documentation

See [CNS_PROJECT_REPORT.md](CNS_PROJECT_REPORT.md) for architecture, threat model, encryption workflow, and results.
