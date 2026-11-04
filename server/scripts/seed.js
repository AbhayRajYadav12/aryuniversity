import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config, paths } from '../src/config.js';
import { writeJson } from '../src/services/jsonStore.js';
import { hashPassword } from '../src/utils/hash.js';
import { uploadAndEncryptBook } from '../src/services/bookService.js';
import { grantPermission } from '../src/services/permissionService.js';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function minimalPdf(title, lines) {
  // Build a simple valid single-page PDF
  const textOps = lines
    .map((line, i) => `BT /F1 14 Tf 50 ${720 - i * 22} Td (${line.replace(/[()\\]/g, '')}) Tj ET`)
    .join('\n');
  const stream = `BT /F1 18 Tf 50 750 Td (${title.replace(/[()\\]/g, '')}) Tj ET\n${textOps}`;
  const objects = [];
  objects.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n');
  objects.push('2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n');
  objects.push(
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n'
  );
  objects.push(
    `4 0 obj<< /Length ${Buffer.byteLength(stream)} >>stream\n${stream}\nendstream\nendobj\n`
  );
  objects.push('5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n');

  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body));
    body += obj;
  }
  const xrefStart = Buffer.byteLength(body);
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  body += xref;
  body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body);
}

async function resetData() {
  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.mkdir(config.encryptedDir, { recursive: true });
  await fs.mkdir(config.keysDir, { recursive: true });

  // Clear encrypted + keys (new + legacy dirs)
  for (const dir of [
    config.encryptedDir,
    config.keysDir,
    config.legacyEncryptedDir,
    config.legacyKeysDir,
    config.tempDir,
  ]) {
    try {
      await fs.mkdir(dir, { recursive: true });
      const files = await fs.readdir(dir);
      for (const f of files) {
        if (f === '.gitkeep') continue;
        await fs.unlink(path.join(dir, f));
      }
    } catch {
      /* ignore */
    }
  }

  await writeJson(paths.users, { users: [] });
  await writeJson(paths.books, { books: [] });
  await writeJson(paths.permissions, { permissions: [] });
  await writeJson(paths.auditLogs, { logs: [] });
  await writeJson(paths.readingHistory, { history: [] });
}

async function main() {
  console.log('Seeding ARY University Secure Digital Library...');
  await fs.mkdir(config.encryptedDir, { recursive: true });
  await fs.mkdir(config.keysDir, { recursive: true });
  await fs.mkdir(config.tempDir, { recursive: true });
  await resetData();

  const adminId = uuidv4();
  const aliceId = uuidv4();
  const bobId = uuidv4();

  const users = [
    {
      id: adminId,
      email: 'admin@university.edu',
      name: 'Library Administrator',
      studentId: null,
      role: 'admin',
      passwordHash: await hashPassword('Admin@12345'),
      createdAt: new Date().toISOString(),
      active: true,
    },
    {
      id: aliceId,
      email: 'alice@university.edu',
      name: 'Alice Johnson',
      studentId: 'STU-1001',
      role: 'student',
      passwordHash: await hashPassword('Student@12345'),
      createdAt: new Date().toISOString(),
      active: true,
    },
    {
      id: bobId,
      email: 'bob@university.edu',
      name: 'Bob Smith',
      studentId: 'STU-1002',
      role: 'student',
      passwordHash: await hashPassword('Student@12345'),
      createdAt: new Date().toISOString(),
      active: true,
    },
  ];

  await writeJson(paths.users, { users });

  const samples = [
    {
      title: 'Introduction to Computer Network Security',
      author: 'Dr. Elena Vargas',
      category: 'Cybersecurity',
      description: 'Foundational concepts in network security, cryptography, and threat models.',
      lines: [
        'Chapter 1: Threat Landscape',
        'Confidentiality, Integrity, Availability',
        'This PDF is encrypted at rest with AES-256-GCM.',
      ],
    },
    {
      title: 'Applied Cryptography Primer',
      author: 'Prof. James Okonkwo',
      category: 'Cryptography',
      description: 'Symmetric ciphers, AEAD modes, and key management practices.',
      lines: [
        'AES-GCM provides confidentiality and authenticity.',
        'Document keys are wrapped by a master key.',
        'Never store raw DEKs in ordinary metadata files.',
      ],
    },
    {
      title: 'Digital Libraries and Access Control',
      author: 'Dr. Mei Chen',
      category: 'Information Systems',
      description: 'RBAC, DRM-style protections, and audit logging for academic collections.',
      lines: [
        'Role-based access control separates admin and student duties.',
        'Permissions may expire or be revoked immediately.',
        'Watermarks deter casual redistribution.',
      ],
    },
  ];

  const createdBooks = [];
  for (const sample of samples) {
    const buffer = minimalPdf(sample.title, sample.lines);
    const { book } = await uploadAndEncryptBook({
      buffer,
      originalFileName: `${sample.title.replace(/\s+/g, '_')}.pdf`,
      title: sample.title,
      author: sample.author,
      category: sample.category,
      description: sample.description,
      uploadedBy: adminId,
    });
    createdBooks.push(book);
    console.log(`  Encrypted: ${book.title}`);
  }

  // Alice: books 0 and 1
  await grantPermission({
    userId: aliceId,
    bookId: createdBooks[0].id,
    grantedBy: adminId,
  });
  await grantPermission({
    userId: aliceId,
    bookId: createdBooks[1].id,
    grantedBy: adminId,
  });

  // Bob: books 1 and 2 (book 2 exclusive vs Alice for cross-access demo)
  await grantPermission({
    userId: bobId,
    bookId: createdBooks[1].id,
    grantedBy: adminId,
  });
  await grantPermission({
    userId: bobId,
    bookId: createdBooks[2].id,
    grantedBy: adminId,
  });

  console.log('\nSeed complete.');
  console.log('Demo accounts:');
  console.log('  Admin:   admin@university.edu / Admin@12345');
  console.log('  Student: alice@university.edu / Student@12345');
  console.log('  Student: bob@university.edu   / Student@12345');
  console.log(`Data dir: ${config.dataDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
