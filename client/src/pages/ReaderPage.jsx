import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, fetchDocumentBlob } from '../api/client';
import { loadPdfFromBlob, renderPageWithWatermark } from '../lib/pdfViewer';

export default function ReaderPage() {
  const { bookId } = useParams();
  const { watermark, user } = useAuth();
  const [book, setBook] = useState(null);
  const [error, setError] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const containerRef = useRef(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let pdfDoc = null;

    async function open() {
      setError('');
      try {
        const meta = await api(`/api/books/${bookId}`);
        if (cancelled) return;
        setBook(meta.book);

        if (meta.book.hasAccess === false && user?.role !== 'admin') {
          setError('Access denied. You are not authorized to read this document.');
          return;
        }

        const blob = await fetchDocumentBlob(bookId);
        if (cancelled) return;

        // Keep blob only in memory via object URL; revoke on cleanup
        blobUrlRef.current = URL.createObjectURL(blob);
        pdfDoc = await loadPdfFromBlob(blob);
        if (cancelled) return;

        setPageCount(pdfDoc.numPages);
        const container = containerRef.current;
        container.innerHTML = '';

        const lines = [
          watermark?.name || user?.name || 'Reader',
          watermark?.studentId || user?.studentId || 'N/A',
          watermark?.email || user?.email || '',
          new Date().toLocaleString(),
        ];

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const wrap = document.createElement('div');
          wrap.className = 'mb-6 rounded-xl overflow-hidden border border-brand-100 bg-white shadow-soft';
          const canvas = document.createElement('canvas');
          canvas.className = 'w-full h-auto block';
          wrap.appendChild(canvas);
          container.appendChild(wrap);
          await renderPageWithWatermark(page, canvas, lines);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to open protected document');
        }
      }
    }

    open();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [bookId, watermark, user]);

  useEffect(() => {
    const block = (e) => e.preventDefault();
    const node = containerRef.current?.parentElement;
    document.addEventListener('contextmenu', block);
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });
    return () => {
      document.removeEventListener('contextmenu', block);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#eef3f9] drm-no-select" onContextMenu={(e) => e.preventDefault()}>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-brand-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link
            to={user?.role === 'admin' ? '/admin/books' : '/student/catalog'}
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="text-center min-w-0">
            <p className="font-semibold truncate">{book?.title || 'Secure reader'}</p>
            <p className="text-[11px] text-brand-900/50">
              Download & print controls hidden · {pageCount ? `${pageCount} pages` : 'Decrypting…'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-brand-600 font-semibold">
            <Shield className="w-4 h-4" /> ARY Secure Reader
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {error ? (
          <div className="card-panel p-8 text-center">
            <p className="text-lg font-semibold text-rose-700">Access denied</p>
            <p className="text-brand-900/60 mt-2">{error}</p>
            <p className="text-xs text-brand-900/40 mt-4">
              Browser deterrents cannot stop screenshots or screen recording. Access control and
              encryption remain enforced on the server.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-900 text-xs px-4 py-3">
              Personalized watermark active for {watermark?.name || user?.name}. Right-click,
              text selection, print, and download shortcuts are disabled in this viewer as
              deterrents — not absolute DRM.
            </div>
            <div ref={containerRef} className="space-y-0" />
          </>
        )}
      </div>
    </div>
  );
}
