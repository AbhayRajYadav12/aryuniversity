import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../../api/client';
import BookCard from '../../components/BookCard';

export default function StudentCatalog() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [author, setAuthor] = useState('All');
  const [sort, setSort] = useState('title');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/books/catalog')
      .then((d) => setBooks(d.books || []))
      .catch((err) => setError(err.message));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(books.map((b) => b.category).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [books]);

  const authors = useMemo(() => {
    const set = new Set(books.map((b) => b.author).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [books]);

  const filtered = books
    .filter((b) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q);
      const matchesCat = category === 'All' || b.category === category;
      const matchesAuthor = author === 'All' || b.author === author;
      return matchesQuery && matchesCat && matchesAuthor;
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'author') return a.author.localeCompare(b.author);
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Library catalog</h1>
        <p className="text-brand-900/55 mt-1">
          Search the collection. Restricted titles show an access-denied state.
        </p>
      </div>

      <div className="card-panel p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-900/40" />
          <input
            className="input pl-9"
            placeholder="Search title, author, or topic…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-40"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="input sm:w-44" value={author} onChange={(e) => setAuthor(e.target.value)}>
          {authors.map((a) => (
            <option key={a} value={a}>
              {a === 'All' ? 'All authors' : a}
            </option>
          ))}
        </select>
        <select className="input sm:w-36" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="title">Sort: Title</option>
          <option value="author">Sort: Author</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              category === c
                ? 'bg-brand-500 text-white'
                : 'bg-white border border-brand-100 text-brand-900/70 hover:bg-brand-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
      {!filtered.length && !error && (
        <p className="text-brand-900/50 text-sm">No books match your filters.</p>
      )}
    </div>
  );
}
