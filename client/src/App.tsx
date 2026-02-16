import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoginPage } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AppLayout } from './components/layout/AppLayout';
import { ProductsPage } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { BOMPage } from './pages/BOMs';
import { BOMDetail } from './pages/BOMDetail';
import { ECOPage } from './pages/ECOs';
import { ECODetail } from './pages/ECODetail';
import { SettingsPage } from './pages/Settings';
import { Signup } from './pages/Signup';
import { UsersPage } from './pages/Users';
import { ReportsPage } from './pages/Reports';
import { RoleRequestPage } from './pages/RoleRequests';
import { AdminRoleRequestsPage } from './pages/AdminRoleRequests';

// Protected Route Component - requires authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background text-zinc-500">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Role-Protected Route Component - requires specific roles
const RoleProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[] 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background text-zinc-500">Loading...</div>;
  }

  const hasAccess = user?.roles?.some((r: string) => allowedRoles.includes(r));

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes with Layout */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              {/* All roles can access */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/boms" element={<BOMPage />} />
              <Route path="/boms/:id" element={<BOMDetail />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* ECOs - ENGINEERING, APPROVER, ADMIN only (not OPERATIONS) */}
              <Route path="/ecos" element={
                <RoleProtectedRoute allowedRoles={['ENGINEERING', 'APPROVER', 'ADMIN']}>
                  <ECOPage />
                </RoleProtectedRoute>
              } />
              <Route path="/ecos/:id" element={
                <RoleProtectedRoute allowedRoles={['ENGINEERING', 'APPROVER', 'ADMIN']}>
                  <ECODetail />
                </RoleProtectedRoute>
              } />

              {/* Settings - All authenticated users */}
              <Route path="/settings" element={<SettingsPage />} />

              {/* Users - ADMIN only */}
              <Route path="/users" element={
                <RoleProtectedRoute allowedRoles={['ADMIN']}>
                  <UsersPage />
                </RoleProtectedRoute>
              } />

              {/* Role Requests - All authenticated users */}
              <Route path="/role-requests" element={<RoleRequestPage />} />

              {/* Admin Role Requests - ADMIN only */}
              <Route path="/admin/role-requests" element={
                <RoleProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminRoleRequestsPage />
                </RoleProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
