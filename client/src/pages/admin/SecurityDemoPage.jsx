import { useState } from 'react';
import { Play, CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import { api } from '../../api/client';

export default function SecurityDemoPage() {
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await api('/api/demo/run', { method: 'POST' });
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-500 text-sm font-semibold uppercase tracking-wide">
            <FlaskConical className="w-4 h-4" /> Security Testing Laboratory
          </div>
          <h1 className="text-3xl font-semibold mt-1">CNS live verification console</h1>
          <p className="text-brand-900/55 mt-1 max-w-2xl">
            Executes real authorization, integrity, and session checks against ARY University
            services — results are computed, not mocked.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={run} disabled={busy}>
          <Play className="w-4 h-4" />
          {busy ? 'Running laboratory tests…' : 'Run live tests'}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {report && (
        <>
          <div className="card-panel p-5 flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-brand-900/50">Passed</p>
              <p className="text-2xl font-semibold text-emerald-700">
                {report.passed}/{report.total}
              </p>
            </div>
            <div>
              <p className="text-sm text-brand-900/50">Failed</p>
              <p className="text-2xl font-semibold text-rose-700">{report.failed}</p>
            </div>
            <div>
              <p className="text-sm text-brand-900/50">Ran at</p>
              <p className="text-sm font-medium">{new Date(report.ranAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            {report.results.map((r) => (
              <div key={r.id} className="card-panel p-4 flex gap-4">
                {r.passed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold">
                    Test {r.id}: {r.name}
                  </p>
                  <p className="text-sm text-brand-900/60 mt-1">
                    Expected: {String(r.expected)} · Actual: {String(r.actual)}
                  </p>
                  <p className="text-xs text-brand-900/40 mt-1">
                    {r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}
                  </p>
                  <p className="text-sm text-brand-900/80 mt-1 font-mono break-all">{r.evidence}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!report && !busy && (
        <div className="card-panel p-8 text-sm text-brand-900/60 space-y-2">
          <p className="font-semibold text-brand-900">Laboratory covers</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Unauthorized document access</li>
            <li>Authentication bypass</li>
            <li>Role-based authorization</li>
            <li>Expired permissions</li>
            <li>Permission revocation</li>
            <li>File tampering / GCM failure</li>
            <li>Encrypted file verification (non-PDF ciphertext)</li>
            <li>Session expiration</li>
          </ol>
        </div>
      )}
    </div>
  );
}
