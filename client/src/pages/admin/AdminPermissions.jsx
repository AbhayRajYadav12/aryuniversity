import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminPermissions() {
  const [permissions, setPermissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ userId: '', bookId: '', expiresAt: '' });
  const [error, setError] = useState('');

  const load = async () => {
    const [p, s, b] = await Promise.all([
      api('/api/admin/permissions'),
      api('/api/admin/students'),
      api('/api/admin/books'),
    ]);
    setPermissions(p.permissions);
    setStudents(s.students);
    setBooks(b.books);
    if (!form.userId && s.students[0]) {
      setForm((f) => ({
        ...f,
        userId: s.students[0].id,
        bookId: b.books[0]?.id || '',
      }));
    }
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const studentName = (id) => students.find((s) => s.id === id)?.name || id;
  const bookTitle = (id) => books.find((b) => b.id === id)?.title || id;

  const onGrant = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/api/admin/permissions', {
        method: 'POST',
        body: {
          userId: form.userId,
          bookId: form.bookId,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        },
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const onRevoke = async (id) => {
    await api(`/api/admin/permissions/${id}/revoke`, { method: 'POST' });
    await load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Permissions</h1>
        <p className="text-brand-900/55 mt-1">
          Grant, expire, or instantly revoke document access. Checked on every decrypt request.
        </p>
      </div>

      <form onSubmit={onGrant} className="card-panel p-6 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Student</label>
          <select
            className="input"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.studentId})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Book</label>
          <select
            className="input"
            value={form.bookId}
            onChange={(e) => setForm({ ...form, bookId: e.target.value })}
          >
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Expires (optional)</label>
          <input
            className="input"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
        </div>
        <div className="sm:col-span-3">
          <button type="submit" className="btn-primary">
            Grant access
          </button>
          {error && <span className="ml-3 text-sm text-red-600">{error}</span>}
        </div>
      </form>

      <div className="card-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/80 text-left">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Book</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {permissions.map((p) => (
              <tr key={p.id} className="border-t border-brand-50">
                <td className="px-4 py-3">{studentName(p.userId)}</td>
                <td className="px-4 py-3">{bookTitle(p.bookId)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold uppercase ${
                      p.status === 'active'
                        ? 'text-emerald-700'
                        : p.status === 'expired'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {p.expiresAt ? new Date(p.expiresAt).toLocaleString() : 'Never'}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.status === 'active' && (
                    <button type="button" className="btn-danger text-xs" onClick={() => onRevoke(p.id)}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
