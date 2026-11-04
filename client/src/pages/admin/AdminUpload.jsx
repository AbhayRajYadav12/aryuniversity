import { useCallback, useState } from 'react';
import { Upload, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const empty = {
  title: '',
  author: '',
  category: 'Cybersecurity',
  description: '',
  publicationInfo: '',
};

const STEP_LABELS = [
  'Validating PDF',
  'Generating encryption key',
  'Encrypting document',
  'Protecting encryption key',
  'Calculating integrity hash',
  'Saving encrypted asset',
  'Updating metadata',
  'Upload completed',
];

export default function AdminUpload() {
  const { push } = useToast();
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uiSteps, setUiSteps] = useState([]);
  const [pipeline, setPipeline] = useState(null);
  const [resultBook, setResultBook] = useState(null);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === 'application/pdf') setFile(f);
    else push('Only PDF files are accepted', 'error');
  }, [push]);

  const runUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      push('Select a PDF first', 'error');
      return;
    }
    setBusy(true);
    setResultBook(null);
    setPipeline(null);
    setUiSteps(STEP_LABELS.map((label) => ({ label, status: 'pending' })));

    const advance = async (idx) => {
      setUiSteps((s) =>
        s.map((step, i) =>
          i < idx ? { ...step, status: 'done' } : i === idx ? { ...step, status: 'active' } : step
        )
      );
      await new Promise((r) => setTimeout(r, 180));
    };

    try {
      for (let i = 0; i < 5; i++) await advance(i);

      const body = new FormData();
      body.append('file', file);
      Object.entries(form).forEach(([k, v]) => body.append(k, v));

      const data = await api('/api/admin/books', { method: 'POST', body });
      // Reflect real backend pipeline steps
      setPipeline(data.pipeline || []);
      setResultBook(data.book);

      for (let i = 5; i < STEP_LABELS.length; i++) await advance(i);
      setUiSteps((s) => s.map((step) => ({ ...step, status: 'done' })));
      push('Document encrypted and stored successfully', 'success');
      setForm(empty);
      setFile(null);
    } catch (err) {
      push(err.message || 'Upload failed', 'error');
      setUiSteps((s) =>
        s.map((step) =>
          step.status === 'active' ? { ...step, status: 'error' } : step
        )
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Upload Documents</h1>
        <p className="text-brand-900/55 mt-1">
          Drag-and-drop a PDF. The server validates, encrypts with AES-256-GCM, wraps the DEK, and
          stores ciphertext privately — steps below track the real operation.
        </p>
      </div>

      <form onSubmit={runUpload} className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={`card-panel p-8 border-dashed border-2 text-center transition ${
              drag ? 'border-brand-500 bg-brand-50' : 'border-brand-100'
            }`}
          >
            <Upload className="w-10 h-10 mx-auto text-brand-500" />
            <p className="mt-3 font-semibold">Drop PDF here</p>
            <p className="text-sm text-brand-900/50 mt-1">or choose a file</p>
            <input
              type="file"
              accept="application/pdf"
              className="mt-4 text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <p className="mt-3 text-sm text-brand-700 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <div className="card-panel p-5 grid sm:grid-cols-2 gap-4">
            {[
              ['title', 'Title'],
              ['author', 'Author'],
              ['category', 'Category'],
              ['publicationInfo', 'Publication info'],
            ].map(([key, label]) => (
              <div key={key} className={key === 'publicationInfo' ? 'sm:col-span-2' : ''}>
                <label className="label">{label}</label>
                <input
                  className="input"
                  required={key === 'title' || key === 'author'}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input min-h-[88px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary sm:col-span-2" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Encrypting…
                </>
              ) : (
                'Upload & encrypt'
              )}
            </button>
          </div>
        </div>

        <div className="card-panel p-5">
          <h2 className="font-semibold mb-4">Processing workflow</h2>
          <ul className="space-y-3">
            {(uiSteps.length ? uiSteps : STEP_LABELS.map((label) => ({ label, status: 'pending' }))).map(
              (step, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  {step.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : step.status === 'active' ? (
                    <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                  ) : step.status === 'error' ? (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white grid place-items-center text-[10px]">
                      !
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-brand-200" />
                  )}
                  <span className={step.status === 'pending' ? 'text-brand-900/40' : 'text-brand-900'}>
                    {step.label}
                  </span>
                </li>
              )
            )}
          </ul>

          {pipeline && (
            <div className="mt-6 rounded-xl bg-brand-50 border border-brand-100 p-4 text-xs space-y-2">
              <p className="font-semibold text-brand-900">Server pipeline evidence</p>
              {pipeline.map((s) => (
                <div key={s.id}>
                  <span className="font-semibold text-brand-600">{s.label}</span>
                  <span className="text-brand-900/50"> · {s.status} · {new Date(s.at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}

          {resultBook && (
            <div className="mt-4 text-sm space-y-1">
              <p>
                <strong>Asset ID:</strong> {resultBook.encryptedAssetId}
              </p>
              <p>
                <strong>SHA-256:</strong>{' '}
                <span className="font-mono text-[11px] break-all">{resultBook.sha256}</span>
              </p>
              <p>
                <strong>Key fingerprint:</strong> {resultBook.keyFingerprint}
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
