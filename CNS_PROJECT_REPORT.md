# Computer Network Security Project Report

## ARY University – Secure Digital Library

**Subtitle:** Secure Knowledge Repository  
**Tagline:** Protecting Knowledge. Securing Access. Empowering Learning.  
**Type:** Local, database-free DRM demonstration  
**Stack:** React (Vite), Express, Node.js `crypto`, JSON + filesystem storage  

---

### 1. Abstract

ARY University Secure Digital Library is a local web application that protects academic PDFs using AES-256-GCM encryption, document-level permissions, authenticated decrypt streaming, personalized watermarks, and auditable security logging — without any external database or cloud service.

### 2. Introduction

Universities increasingly distribute lecture notes and research PDFs digitally. Without technical controls, these assets are trivial to copy and redistribute. This CNS project demonstrates practical cryptography and access control suitable for an academic exhibition, while documenting honest limits of browser-side DRM.

### 3. Problem statement

How can a university digital library discourage unauthorized downloading and sharing while remaining fully operable on a student laptop with no paid infrastructure?

### 4. Objectives

1. Encrypt uploads with AES-256-GCM.  
2. Separate ciphertext from wrapped document keys.  
3. Enforce admin/student RBAC and per-document ACL.  
4. Deliver plaintext only through authenticated APIs.  
5. Overlay dynamic ARY watermarks in a PDF.js reader.  
6. Provide Encryption Center, monitoring, and a live security lab.  

### 5–6. Existing vs proposed system

Traditional shared folders expose plaintext files. The proposed system encrypts at rest, authorizes on every open, logs denials, and presents a premium ARY-branded portal for administrators and students.

### 7. System architecture

- **Client:** Landing page, auth, admin portal, student portal, secure reader  
- **API:** JWT cookies, CSRF, RBAC, upload/encrypt, decrypt stream, demo runner  
- **Storage:** `users.json`, `books.json`, `permissions.json`, `audit-logs.json`, `encrypted-books/`, `protected-keys/`  

### 8–9. Encryption / decryption workflow

Upload → validate PDF → generate 256-bit DEK → AES-256-GCM encrypt → wrap DEK with `MASTER_KEY` → store ciphertext + wrapped key → record SHA-256.  
Read → authenticate → check permission → unwrap DEK → decrypt in memory → verify GCM tag → stream `Cache-Control: no-store` → watermark client-side.

### 10–12. AES-GCM, SHA-256, key management

AES-256-GCM provides confidentiality and authenticity. SHA-256 fingerprints plaintext at upload. Master key lives in local `.env` (coursework limitation vs HSM).

### 13–14. Authn/z and DRM-style protection

Argon2id passwords, httpOnly JWT, CSRF, rate-limited login, permission expiry/revoke. Reader hides download/print UI, blocks context menu/selection shortcuts, and watermarks pages with **ARY UNIVERSITY – CONFIDENTIAL** plus student identity.

### 15. Database-free storage

Atomic JSON writes with per-file mutexes; private vault directories are never statically hosted.

### 16. Threat model

Mitigations for stolen hashes, ciphertext theft without master key, unauthorized API access, tampering, CSRF. Residual risks: OS user with disk access, screenshots/screen recording, local `.env` master key.

### 17–18. Security testing & results

| # | Test | Result |
|---|------|--------|
| 1 | Unauthorized document access | PASS |
| 2 | Authentication bypass | PASS |
| 3 | Student → admin API | PASS |
| 4 | Expired permission | PASS |
| 5 | Revoked permission | PASS |
| 6 | Ciphertext tampering | PASS |
| 7 | Encrypted file not readable PDF | PASS |
| 8 | Expired session JWT | PASS |

### 19–21. Limitations, future work, conclusion

Browser DRM is deterrent-only. Future: HSM/OS keychain, watermarking that survives capture, multi-institution deploy. The system meets CNS demonstration goals with genuine cryptography and a polished ARY University product experience.
