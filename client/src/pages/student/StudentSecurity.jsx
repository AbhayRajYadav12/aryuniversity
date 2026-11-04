export default function StudentSecurity() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Security Information</h1>
        <p className="text-brand-900/55 mt-1">
          How ARY University protects documents you are authorized to read.
        </p>
      </div>
      <div className="card-panel p-6 space-y-4 text-sm text-brand-900/75 max-w-3xl">
        <p>
          Documents are stored as AES-256-GCM ciphertext. Your browser never receives encryption
          keys or filesystem paths. Content is decrypted in server memory and streamed only after
          your session and permission are verified.
        </p>
        <p>
          The secure reader hides download/print controls, discourages selection and context menus,
          and overlays a personalized watermark including{' '}
          <strong>ARY UNIVERSITY – CONFIDENTIAL</strong>, your name, student ID, email, and access
          time.
        </p>
        <p className="rounded-xl bg-amber-50 border border-amber-100 text-amber-900 px-4 py-3 text-xs">
          Browser DRM cannot fully prevent screenshots, screen recording, or photography. These
          controls are deterrents; server-side authorization and encryption remain the primary
          safeguards.
        </p>
      </div>
    </div>
  );
}
