import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const empty = {
  name: '',
  email: '',
  studentId: '',
  password: '',
};

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () =>
    api('/api/admin/students')
      .then((d) => setStudents(d.students))
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/api/admin/students', { method: 'POST', body: form });
      setForm(empty);
      setMessage('Student created (password hashed with Argon2id).');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (student) => {
    await api(`/api/admin/students/${student.id}`, {
      method: 'PATCH',
      body: { active: !student.active },
    });
    await load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Student management</h1>
        <p className="text-brand-900/55 mt-1">Passwords are never stored in plaintext.</p>
      </div>

      <form onSubmit={onCreate} className="card-panel p-6 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Full name</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Student ID</label>
          <input
            className="input"
            required
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Temporary password</label>
          <input
            className="input"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button type="submit" className="btn-primary">
            Add student
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}
        </div>
      </form>

      <div className="card-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/80 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-brand-50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.studentId}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold ${
                      s.active ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {s.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="btn-secondary" onClick={() => toggleActive(s)}>
                    {s.active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
