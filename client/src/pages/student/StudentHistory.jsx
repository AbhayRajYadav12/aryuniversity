import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function StudentHistory() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/me/history')
      .then((d) => setHistory(d.history || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Reading history</h1>
        <p className="text-brand-900/55 mt-1">Your authenticated document open events.</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="card-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/80 text-left">
            <tr>
              <th className="px-4 py-3">Book</th>
              <th className="px-4 py-3">Accessed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-t border-brand-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{h.book?.title || 'Unknown'}</p>
                  <p className="text-xs text-brand-900/50">{h.book?.author}</p>
                </td>
                <td className="px-4 py-3 text-brand-900/60">
                  {new Date(h.accessedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {h.book?.id && (
                    <Link to={`/reader/${h.book.id}`} className="btn-secondary text-xs">
                      Open again
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {!history.length && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-brand-900/50">
                  No reading sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
