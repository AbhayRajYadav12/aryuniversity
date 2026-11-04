export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">System Settings</h1>
        <p className="text-brand-900/55 mt-1">
          Local demonstration configuration for ARY University Secure Digital Library.
        </p>
      </div>
      <div className="card-panel p-6 space-y-4 text-sm">
        <Row label="Product" value="ARY Digital Library" />
        <Row label="Storage model" value="JSON files + encrypted filesystem vault" />
        <Row label="Cipher" value="AES-256-GCM (Node.js crypto)" />
        <Row label="Password hashing" value="Argon2id" />
        <Row label="Session" value="JWT httpOnly cookie (udl_session)" />
        <Row label="Master key" value="Loaded from server/.env (MASTER_KEY) — never shipped to browser" />
        <Row label="Vault directories" value="data/encrypted-books · data/protected-keys" />
        <Row
          label="Limitation"
          value="Local .env key storage is suitable for coursework demos, not multi-tenant production HSMs."
        />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-brand-50 pb-3">
      <span className="text-brand-900/50">{label}</span>
      <span className="font-medium text-brand-900 max-w-xl text-right">{value}</span>
    </div>
  );
}
