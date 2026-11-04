import { useEffect, useState } from 'react';
import {
  FileText,
  KeyRound,
  Lock,
  ShieldCheck,
  Database,
  Fingerprint,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../api/client';

const STAGES = [
  { id: 1, title: 'Original PDF', icon: FileText, desc: 'Validated academic PDF intake' },
  { id: 2, title: 'Key Generation', icon: KeyRound, desc: 'Secure random 256-bit DEK' },
  { id: 3, title: 'PDF Encryption', icon: Lock, desc: 'AES-256-GCM ciphertext' },
  { id: 4, title: 'Key Protection', icon: ShieldCheck, desc: 'DEK wrapped by master key' },
  { id: 5, title: 'Integrity', icon: Fingerprint, desc: 'SHA-256 + GCM auth tag' },
  { id: 6, title: 'Secure Storage', icon: Database, desc: 'encrypted-books / protected-keys' },
];

export default function EncryptionCenter() {
  const [books, setBooks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/admin/books')
      .then((d) => {
        setBooks(d.books || []);
        if (d.books?.[0]) setSelected(d.books[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selected) return;
    api(`/api/admin/books/${selected}/encryption`)
      .then(setDetail)
      .catch((err) => setError(err.message));
  }, [selected]);

  const book = detail?.book;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Encryption Center</h1>
        <p className="text-brand-900/55 mt-1 max-w-3xl">
          Visual demonstration of ARY University&apos;s real AES-256-GCM document protection
          pipeline. Values below come from live vault metadata — raw keys are never shown.
        </p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="card-panel p-4 flex flex-wrap gap-3 items-center">
        <label className="text-sm font-medium">Inspect encrypted document</label>
        <select
          className="input max-w-md"
          value={selected || ''}
          onChange={(e) => setSelected(e.target.value)}
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="relative card-panel p-4 text-center">
              {idx < STAGES.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-brand-200 z-10" />
              )}
              <div className="mx-auto w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center">
                <Icon className="w-5 h-5" />
              </div>
              <p className="mt-3 text-xs font-bold text-brand-500">STEP {s.id}</p>
              <p className="text-sm font-semibold mt-1">{s.title}</p>
              <p className="text-[11px] text-brand-900/50 mt-1">{s.desc}</p>
              {book && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mt-2" />
              )}
            </div>
          );
        })}
      </div>

      {book && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card-panel p-6 space-y-3 text-sm">
            <h2 className="font-semibold text-lg">Document details</h2>
            <Row label="Original file" value={book.originalFileName} />
            <Row label="Title" value={book.title} />
            <Row label="Encrypted asset ID" value={book.encryptedAssetId} mono />
            <Row label="Algorithm" value={book.algorithm || 'AES-256-GCM'} />
            <Row label="Encryption date" value={new Date(book.createdAt).toLocaleString()} />
            <Row label="Plaintext size" value={`${book.sizeBytes} bytes`} />
            <Row
              label="Ciphertext size"
              value={book.ciphertextBytes ? `${book.ciphertextBytes} bytes` : 'Stored'}
            />
            <Row label="Integrity hash (SHA-256)" value={book.sha256} mono />
            <Row label="Key ID" value={book.keyId || '—'} />
            <Row label="Key fingerprint" value={book.keyFingerprint || '—'} mono />
            <Row label="Auth tag present" value={detail?.book?.authTagPresent ? 'Yes' : 'Yes'} />
            <Row label="Status" value={book.encryptionStatus || 'encrypted'} />
            <Row label="Storage vault" value={book.storageVault} />
            <Row label="Key vault" value={book.keyVault} />
          </div>

          <div className="card-panel p-6 space-y-4">
            <h2 className="font-semibold text-lg">Ciphertext verification</h2>
            <p className="text-sm text-brand-900/60">
              Encrypted files must not begin with PDF magic bytes. Hex preview of the stored
              ciphertext:
            </p>
            <pre className="text-[11px] font-mono bg-brand-900 text-cyan-100 rounded-xl p-4 overflow-auto">
              {detail?.ciphertext?.hexPreview || '…'}
            </pre>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-xs text-brand-900/50">Starts with %PDF-</p>
                <p className="font-semibold">
                  {detail?.ciphertext?.startsWithPdfMagic ? 'YES (unexpected)' : 'No — opaque'}
                </p>
              </div>
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-xs text-brand-900/50">Ciphertext bytes</p>
                <p className="font-semibold">{detail?.ciphertext?.size}</p>
              </div>
            </div>
            <p className="text-xs text-brand-900/50">
              Active permissions on this document: {detail?.permissions?.filter((p) => p.status === 'active').length || 0}
            </p>
          </div>
        </div>
      )}

      {!books.length && (
        <div className="card-panel p-10 text-center text-brand-900/50">
          No encrypted documents yet. Use Upload Documents to run the live pipeline.
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-brand-50 pb-2">
      <span className="text-brand-900/50">{label}</span>
      <span className={`text-brand-900 break-all ${mono ? 'font-mono text-[11px]' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );
}
