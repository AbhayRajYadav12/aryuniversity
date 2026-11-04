import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import StudentLayout from './components/StudentLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBooks from './pages/admin/AdminBooks';
import AdminUpload from './pages/admin/AdminUpload';
import AdminStudents from './pages/admin/AdminStudents';
import AdminPermissions from './pages/admin/AdminPermissions';
import EncryptionCenter from './pages/admin/EncryptionCenter';
import SecurityMonitoring from './pages/admin/SecurityMonitoring';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import SecurityDemoPage from './pages/admin/SecurityDemoPage';
import AdminSettings from './pages/admin/AdminSettings';
import StudentHome from './pages/student/StudentHome';
import StudentCatalog from './pages/student/StudentCatalog';
import StudentHistory from './pages/student/StudentHistory';
import StudentMyBooks from './pages/student/StudentMyBooks';
import StudentProfile from './pages/student/StudentProfile';
import StudentSecurity from './pages/student/StudentSecurity';
import ReaderPage from './pages/ReaderPage';

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-brand-700">
        Loading secure ARY session…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  }
  return children;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-brand-700">
        Starting ARY University Secure Digital Library…
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminLayout />
          </Protected>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="books" element={<AdminBooks />} />
        <Route path="upload" element={<AdminUpload />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="permissions" element={<AdminPermissions />} />
        <Route path="encryption" element={<EncryptionCenter />} />
        <Route path="monitoring" element={<SecurityMonitoring />} />
        <Route path="audit" element={<AdminAuditLogs />} />
        <Route path="security-lab" element={<SecurityDemoPage />} />
        <Route path="security-demo" element={<SecurityDemoPage />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="/student"
        element={
          <Protected role="student">
            <StudentLayout />
          </Protected>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="catalog" element={<StudentCatalog />} />
        <Route path="books" element={<StudentMyBooks />} />
        <Route path="history" element={<StudentHistory />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="security" element={<StudentSecurity />} />
      </Route>

      <Route
        path="/reader/:bookId"
        element={
          <Protected>
            <ReaderPage />
          </Protected>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
