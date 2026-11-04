import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import BookCard from '../../components/BookCard';

export default function StudentMyBooks() {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/books')
      .then((d) => setBooks(d.books || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">My Books</h1>
        <p className="text-brand-900/55 mt-1">Titles you are currently authorized to open.</p>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((book) => (
          <BookCard key={book.id} book={{ ...book, hasAccess: true }} />
        ))}
      </div>
      {!books.length && !error && (
        <div className="card-panel p-10 text-center text-brand-900/50">
          No active permissions. Ask an administrator to grant access.
        </div>
      )}
    </div>
  );
}
