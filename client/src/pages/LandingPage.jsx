import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Eye,
  KeyRound,
  FileKey2,
  Users,
  BookOpenCheck,
  ArrowRight,
} from 'lucide-react';
import AryLogo from '../components/AryLogo';

const features = [
  {
    icon: Lock,
    title: 'AES-256-GCM Encryption',
    text: 'Every uploaded PDF is encrypted at rest with authenticated encryption.',
  },
  {
    icon: KeyRound,
    title: 'Protected Document Keys',
    text: 'Per-document keys are wrapped by a master key and stored separately from ciphertext.',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    text: 'Administrators manage the vault; students only open authorized titles.',
  },
  {
    icon: Eye,
    title: 'Personalized Watermarks',
    text: 'Each reading session overlays student identity to discourage casual sharing.',
  },
  {
    icon: FileKey2,
    title: 'Integrity Verification',
    text: 'SHA-256 hashing and GCM authentication tags detect tampered files.',
  },
  {
    icon: Shield,
    title: 'Security Monitoring',
    text: 'Access attempts, denials, and integrity failures are recorded in audit logs.',
  },
];

const steps = [
  'Upload academic PDF',
  'Generate document key',
  'Encrypt with AES-256-GCM',
  'Wrap key with master secret',
  'Store ciphertext privately',
  'Authorize students to read',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-brand-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <AryLogo size="sm" />
          <div className="flex items-center gap-2">
            <Link to="/login?role=student" className="btn-secondary hidden sm:inline-flex">
              Student Login
            </Link>
            <Link to="/login?role=admin" className="btn-primary">
              Administrator
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 420px at 15% 0%, rgba(11,95,255,.16), transparent 55%), radial-gradient(700px 380px at 90% 10%, rgba(14,165,233,.12), transparent 50%), linear-gradient(180deg,#f8fbff 0%,#eef4fb 100%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500 mb-4">
              Secure Knowledge Repository
            </p>
            <h1 className="font-display text-4xl sm:text-5xl leading-tight text-brand-900">
              Your Knowledge. Our Responsibility.
            </h1>
            <p className="mt-5 text-lg text-brand-900/65 max-w-xl">
              ARY University protects academic PDFs with real cryptography, document-level
              permissions, and DRM-style reading controls — built for Computer Network Security
              demonstration and trusted campus learning.
            </p>
            <p className="mt-3 text-sm font-medium text-brand-600 italic">
              Protecting Knowledge. Securing Access. Empowering Learning.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login?role=student" className="btn-primary">
                Explore Digital Library <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login?role=student" className="btn-secondary">
                Secure Student Login
              </Link>
            </div>
          </div>
          <div className="card-panel p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-cyan-300/10" />
            <div className="relative space-y-4">
              <div className="rounded-2xl bg-brand-900 text-white p-5">
                <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                  <BookOpenCheck className="w-4 h-4" /> Encryption pipeline
                </div>
                <p className="font-display text-2xl">AES-256-GCM at rest</p>
                <p className="text-sm text-white/70 mt-2">
                  Ciphertext in private storage. Keys wrapped separately. Access audited.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['Authenticated', 'Permissioned', 'Watermarked', 'Tamper-aware'].map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-brand-800"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-3xl text-brand-900">About ARY Digital Library</h2>
        <p className="mt-3 text-brand-900/65 max-w-3xl">
          A local, database-free secure repository for lecture notes, research papers, and
          textbooks. Administrators encrypt uploads; students read only what they are granted —
          through an authenticated decrypt stream, never a public file URL.
        </p>
      </section>

      <section className="bg-white border-y border-brand-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-display text-3xl text-brand-900">Why Digital Document Protection Matters</h2>
          <p className="mt-3 text-brand-900/65 max-w-3xl">
            University materials are easy to redistribute once downloaded. Encryption at rest,
            authorization on every open, and identifiable watermarks raise the cost of casual
            leakage and create an auditable access trail for CNS education.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-3xl text-brand-900 mb-8">How Our Security System Works</h2>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <li key={s} className="card-panel p-5">
              <span className="text-xs font-bold text-brand-500">STEP {i + 1}</span>
              <p className="mt-2 font-semibold text-brand-900">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-brand-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-display text-3xl mb-8">Security Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <Icon className="w-5 h-5 text-cyan-300" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-3xl text-brand-900">Digital Learning Resources</h2>
          <p className="mt-3 text-brand-900/65">
            Cybersecurity primers, cryptography notes, information-systems papers, and faculty
            handouts — delivered only after permission checks succeed.
          </p>
        </div>
        <div>
          <h2 className="font-display text-3xl text-brand-900">Confidentiality & Access Control</h2>
          <p className="mt-3 text-brand-900/65">
            Sessions use httpOnly JWTs, CSRF protection, Argon2id password hashes, and immediate
            permission revocation. Browser DRM deterrents help, but screenshots remain a known
            limitation — documented honestly for academic evaluation.
          </p>
        </div>
      </section>

      <footer className="border-t border-brand-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <AryLogo />
          <p className="text-sm text-brand-900/50 max-w-md">
            ARY UNIVERSITY · Computer Network Security academic demonstration · Local JSON storage
            · No external database.
          </p>
        </div>
      </footer>
    </div>
  );
}
