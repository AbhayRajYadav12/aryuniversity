import { BookOpen, Lock, Unlock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BookCard({ book, showAccess = true }) {
  const locked = showAccess && book.hasAccess === false;

  return (
    <article className="group card-panel overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className="h-36 relative flex items-end p-4"
        style={{
          background: `linear-gradient(145deg, ${book.coverColor || '#0b5fff'} 0%, #0a1f44 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
        <BookOpen className="absolute top-4 right-4 w-8 h-8 text-white/40" />
        <div className="relative">
          <p className="text-xs uppercase tracking-wide text-white/70">{book.category}</p>
          <h3 className="text-white font-semibold leading-snug line-clamp-2">{book.title}</h3>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm text-brand-900/60">by {book.author}</p>
        <p className="text-sm text-brand-900/70 line-clamp-2">{book.description}</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          {showAccess && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                locked ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {locked ? 'Restricted' : 'Authorized'}
            </span>
          )}
          {locked ? (
            <span className="text-xs text-brand-900/40">Access denied</span>
          ) : (
            <Link to={`/reader/${book.id}`} className="btn-primary text-xs py-1.5">
              Read securely
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
