import { useAuth } from '../../context/AuthContext';

export default function StudentProfile() {
  const { user, watermark } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">My Profile</h1>
        <p className="text-brand-900/55 mt-1">Identity used for authentication and watermarking.</p>
      </div>
      <div className="card-panel p-6 space-y-3 text-sm max-w-xl">
        <Row label="Name" value={user?.name} />
        <Row label="Student ID" value={user?.studentId} />
        <Row label="University email" value={user?.email} />
        <Row label="Role" value={user?.role} />
        <Row
          label="Watermark preview"
          value={`${watermark?.name} · ${watermark?.studentId} · ${watermark?.email}`}
        />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-brand-50 pb-2">
      <span className="text-brand-900/50">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
