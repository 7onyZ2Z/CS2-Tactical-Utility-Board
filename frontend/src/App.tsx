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
          colorPrimary: '#4ade80',
          colorBgContainer: '#161b22',
          colorBgLayout: '#0d1117',
          colorBorder: '#21262d',
          colorText: '#e0e0e0',
          colorTextSecondary: '#8b949e',
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
