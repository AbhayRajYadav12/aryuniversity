import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, KeyRound, Archive } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function AdminBooks() {
  const { push } = useToast();
  const [books, setBooks] = useState([]);
  const [perms, setPerms] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api('/api/admin/books'), api('/api/admin/permissions')])
      .then(([b, p]) => {
        setBooks(b.books || []);
        setPerms(p.permissions || []);
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const activeCount = (bookId) =>
    perms.filter((p) => p.bookId === bookId && p.status === 'active').length;

  const onDelete = async (id) => {
    if (!confirm('Delete this encrypted book and its key material?')) return;
    await api(`/api/admin/books/${id}`, { method: 'DELETE' });
    push('Book deleted from vault', 'success');
    await load();
  };

  const onArchive = async (id) => {
    await api(`/api/admin/books/${id}`, { method: 'PATCH', body: { status: 'archived' } });
    push('Book archived', 'success');
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Digital Books</h1>
          <p className="text-brand-900/55 mt-1">Encrypted collection managed by ARY administrators.</p>
        </div>
        <Link to="/admin/upload" className="btn-primary">
          Upload document
        </Link>
      </div>
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((b) => (
          <article key={b.id} className="card-panel overflow-hidden">
            <div
              className="h-28 p-4 flex items-end"
              style={{
                background: `linear-gradient(145deg, ${b.coverColor || '#0b5fff'}, #0a1f44)`,
              }}
            >
              <div>
                <p className="text-[11px] uppercase text-white/70">{b.category}</p>
                <h3 className="text-white font-semibold line-clamp-2">{b.title}</h3>
              </div>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <p className="text-brand-900/60">by {b.author}</p>
              <p className="text-xs">
                <span className="font-semibold text-emerald-700">Encrypted</span> ·{' '}
                {Math.round((b.sizeBytes || 0) / 1024)} KB · {activeCount(b.id)} active grants
              </p>
              <p className="text-[11px] text-brand-900/45">
                Uploaded {new Date(b.createdAt).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Link to="/admin/encryption" className="btn-secondary text-xs py-1.5">
                  View details
                </Link>
                <Link to="/admin/permissions" className="btn-secondary text-xs py-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Permissions
                </Link>
                <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => onArchive(b.id)}>
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
                <button type="button" className="btn-secondary text-xs py-1.5 text-rose-600" onClick={() => onDelete(b.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!books.length && (
        <div className="card-panel p-10 text-center text-brand-900/50">
          No books yet. Upload a PDF to begin encryption.
        </div>
      )}
    </div>
  );
}
