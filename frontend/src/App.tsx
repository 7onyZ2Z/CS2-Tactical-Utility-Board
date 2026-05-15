import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import MainLayout from './components/MainLayout';

function ProtectedRoute({ user, loading, children }: { user: unknown; loading: boolean; children: React.ReactNode }) {
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading, checkAuth, login, logout } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    checkAuth().finally(() => setInitialized(true));
  }, [checkAuth]);

  if (!initialized) return null;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#d4a853',
          colorPrimaryHover: '#e6c97a',
          colorPrimaryActive: '#c09840',
          colorBgContainer: '#221d18',
          colorBgLayout: '#1a1612',
          colorBgElevated: '#2a241e',
          colorBorder: '#3d3628',
          colorBorderSecondary: '#2e2820',
          colorText: '#f5ead6',
          colorTextSecondary: '#b8956a',
          colorTextTertiary: '#8a7560',
          colorSuccess: '#d4a853',
          colorWarning: '#e8c840',
          colorError: '#e05540',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />
          } />
          <Route path="/" element={
            <ProtectedRoute user={user} loading={loading}>
              <MainLayout user={user!} onLogout={logout} />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
