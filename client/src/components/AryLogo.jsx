export default function AryLogo({ size = 'md', light = false, showText = true }) {
  const dims = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const text = light ? 'text-white' : 'text-brand-900';
  const sub = light ? 'text-white/75' : 'text-brand-900/55';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${dims} rounded-xl flex items-center justify-center shrink-0 shadow-soft`}
        style={{
          background: light
            ? 'linear-gradient(145deg,#ffffff33,#ffffff11)'
            : 'linear-gradient(145deg,#0a1f44,#0b5fff)',
        }}
        aria-hidden
      >
        <svg viewBox="0 0 48 48" className={`${size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'} text-white`}>
          <path
            fill="currentColor"
            d="M24 6l14 8v10c0 9.2-6.1 17.5-14 20-7.9-2.5-14-10.8-14-20V14l14-8zm0 4.2L14 16v8.1c0 6.7 4.2 12.8 10 15.2 5.8-2.4 10-8.5 10-15.2V16L24 10.2z"
          />
          <path fill="currentColor" d="M22 22h4v10h-4zm0-6h4v4h-4z" opacity=".9" />
        </svg>
      </div>
      {showText && (
        <div className="min-w-0">
          <p className={`font-display font-bold leading-tight tracking-tight ${text}`}>
            ARY UNIVERSITY
          </p>
          <p className={`text-[11px] leading-tight ${sub}`}>Secure Digital Library</p>
        </div>
      )}
    </div>
  );
}
