import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import BookCard from '../../components/BookCard';

export default function StudentHome() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    Promise.all([api('/api/books'), api('/api/me/history'), api('/api/books/catalog')]).then(
      ([b, h, c]) => {
        setBooks(b.books || []);
        setHistory(h.history || []);
        setCatalog(c.books || []);
      }
    );
  }, []);

  const recentIds = [...new Set(history.map((h) => h.bookId))].slice(0, 3);
  const recentBooks = recentIds
    .map((id) => books.find((b) => b.id === id) || history.find((h) => h.bookId === id)?.book)
    .filter(Boolean);

  const categories = [...new Set(catalog.map((b) => b.category))].slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="card-panel p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 via-transparent to-cyan-300/10" />
        <div className="relative">
          <p className="text-sm font-semibold text-brand-500 uppercase tracking-wide">
            ARY University · Student Portal
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-900 mt-2">
            Welcome, {user?.name}
          </h1>
          <p className="text-brand-900/60 mt-2">
            Student ID <strong>{user?.studentId}</strong> · {user?.email}
          </p>
          <p className="text-brand-900/55 mt-3 max-w-xl">
            Your authorized encrypted collection is ready. Every page you open carries a
            personalized ARY watermark.
          </p>
          <Link to="/student/catalog" className="btn-primary mt-5 inline-flex">
            Explore library
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Available digital books</h2>
          <Link to="/student/books" className="text-sm text-brand-600 font-semibold">
            My books
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.slice(0, 3).map((book) => (
            <BookCard key={book.id} book={{ ...book, hasAccess: true }} />
          ))}
          {!books.length && (
            <p className="text-brand-900/50 text-sm">No books assigned yet. Contact the librarian.</p>
          )}
        </div>
      </section>

      {recentBooks.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Recently accessed</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBooks.map((book) => (
              <BookCard key={book.id} book={{ ...book, hasAccess: true }} />
            ))}
          </div>
        </section>
      )}

      <section className="card-panel p-5">
        <h2 className="font-semibold mb-3">Recommended academic categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c}
              to="/student/catalog"
              className="rounded-lg bg-brand-50 text-brand-700 px-3 py-1.5 text-sm font-medium"
            >
              {c}
            </Link>
          ))}
        </div>
        <p className="text-sm text-brand-900/55 mt-4">
          Reading progress: {history.length} recorded secure session
          {history.length === 1 ? '' : 's'}.
        </p>
      </section>
    </div>
  );
}
