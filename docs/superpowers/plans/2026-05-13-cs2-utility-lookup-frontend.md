# CS2 道具点位速查网站 - 前端实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 CS2 道具点位速查网站的前端，包含登录页和主页面（侧边栏筛选 + 卡片网格 + 详情页）。

**Architecture:** React SPA，2 个路由（登录 + 主页），Ant Design 暗色主题，Axios 统一处理认证，组件按页面职责拆分。

**Tech Stack:** React 18, Vite, TypeScript, Ant Design 5, React Router v6, Axios

---

## File Structure

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── src/
│   ├── main.tsx              # ReactDOM 入口 + 主题 Provider
│   ├── App.tsx               # 路由配置
│   ├── types.ts              # TS 类型
│   ├── api/
│   │   ├── client.ts         # Axios 实例 + 拦截器
│   │   ├── auth.ts           # login / logout / me
│   │   ├── maps.ts           # list maps
│   │   └── lineups.ts        # list / get detail
│   ├── hooks/
│   │   └── useAuth.ts        # 认证状态管理
│   └── components/
│       ├── LoginPage.tsx     # 登录页
│       ├── MainLayout.tsx    # 主布局
│       ├── Header.tsx        # 顶部栏
│       ├── Sidebar.tsx       # 筛选栏
│       ├── LineupGrid.tsx    # 卡片网格
│       ├── LineupCard.tsx    # 单个卡片
│       └── LineupDetail.tsx  # 点位详情
```

---

### Task 1: Vite + React 项目初始化

**Files:**
- Create: `frontend/` (整个目录结构)

- [ ] **Step 1: 用 Vite 创建 React + TypeScript 项目**

```bash
cd /Users/tony/Code/Utility_Lookup
npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: 安装依赖**

```bash
cd frontend
npm install antd @ant-design/icons react-router-dom axios
```

- [ ] **Step 3: 配置 vite.config.ts**

替换 `frontend/vite.config.ts` 内容为：

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000',
    },
  },
})
```

- [ ] **Step 4: 清理默认文件**

删除 Vite 模板自带的 `src/App.css`、`src/index.css`、`src/assets/`、`public/vite.svg`。

- [ ] **Step 5: 创建目录结构**

```bash
mkdir -p src/api src/hooks src/components
```

- [ ] **Step 6: 验证开发服务器启动**

```bash
npm run dev
```

Expected: 服务器启动在 http://localhost:5173

- [ ] **Step 7: 提交**

```bash
cd /Users/tony/Code/Utility_Lookup
git add frontend/
git commit -m "feat: init React + Vite + TypeScript frontend project"
```

---

### Task 2: TS 类型定义 + API 层

**Files:**
- Create: `frontend/src/types.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/src/api/maps.ts`
- Create: `frontend/src/api/lineups.ts`

- [ ] **Step 1: 创建 types.ts**

```ts
export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

export interface MapResponse {
  id: number;
  name: string;
  display_name: string;
  image_url: string | null;
}

export interface MediaResponse {
  id: number;
  lineup_id: number;
  file_type: string;
  file_path: string;
  sort_order: number;
}

export interface LineupResponse {
  id: number;
  name: string;
  map_id: number;
  utility_type: string;
  side: string;
  pos_x: number | null;
  pos_y: number | null;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  media: MediaResponse[];
}

export interface LineupListResponse {
  items: LineupResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface LineupQueryParams {
  map_id?: number;
  utility_type?: string;
  side?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}
```

- [ ] **Step 2: 创建 api/client.ts**

```ts
import axios from 'axios';
import { TokenResponse } from '../types';

const client = axios.create({
  baseURL: '',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

- [ ] **Step 3: 创建 api/auth.ts**

```ts
import client from './client';
import { LoginRequest, TokenResponse, UserResponse } from '../types';

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/api/auth/login', data);
  return res.data;
}

export async function logout(): Promise<void> {
  await client.post('/api/auth/logout');
}

export async function getMe(): Promise<UserResponse> {
  const res = await client.get<UserResponse>('/api/auth/me');
  return res.data;
}
```

- [ ] **Step 4: 创建 api/maps.ts**

```ts
import client from './client';
import { MapResponse } from '../types';

export async function listMaps(): Promise<MapResponse[]> {
  const res = await client.get<MapResponse[]>('/api/maps');
  return res.data;
}
```

- [ ] **Step 5: 创建 api/lineups.ts**

```ts
import client from './client';
import { LineupListResponse, LineupQueryParams, LineupResponse } from '../types';

export async function listLineups(params?: LineupQueryParams): Promise<LineupListResponse> {
  const res = await client.get<LineupListResponse>('/api/lineups', { params });
  return res.data;
}

export async function getLineup(id: number): Promise<LineupResponse> {
  const res = await client.get<LineupResponse>(`/api/lineups/${id}`);
  return res.data;
}
```

- [ ] **Step 6: 提交**

```bash
cd /Users/tony/Code/Utility_Lookup
git add frontend/src/types.ts frontend/src/api/
git commit -m "feat: add TS types and API layer with Axios interceptors"
```

---

### Task 3: 认证 Hook + 路由配置 + 入口

**Files:**
- Create: `frontend/src/hooks/useAuth.ts`
- Create: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: 创建 hooks/useAuth.ts**

```tsx
import { useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { UserResponse } from '../types';

export function useAuth() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return false;
    }
    try {
      const me = await authApi.getMe();
      setUser(me);
      setLoading(false);
      return true;
    } catch {
      localStorage.removeItem('token');
      setLoading(false);
      return false;
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authApi.login({ username, password });
    localStorage.setItem('token', res.access_token);
    const me = await authApi.getMe();
    setUser(me);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return { user, loading, checkAuth, login, logout };
}
```

- [ ] **Step 2: 创建 App.tsx**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import MainLayout from './components/MainLayout';

function ProtectedRoute({ user, loading, children }: { user: any; loading: boolean; children: React.ReactNode }) {
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
              <MainLayout user={user} onLogout={logout} />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
```

- [ ] **Step 3: 修改 main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: 验证编译通过**

```bash
cd /Users/tony/Code/Utility_Lookup/frontend
npm run build
```

Expected: 编译成功（可能有 LoginPage/MainLayout 未导入的警告，下一步创建）

- [ ] **Step 5: 提交**

```bash
cd /Users/tony/Code/Utility_Lookup
git add frontend/src/App.tsx frontend/src/main.tsx frontend/src/hooks/
git commit -m "feat: add auth hook, route config, and Ant Design dark theme"
```

---

### Task 4: 登录页

**Files:**
- Create: `frontend/src/components/LoginPage.tsx`

- [ ] **Step 1: 创建 LoginPage.tsx**

```tsx
import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await onLogin(values.username, values.password);
    } catch {
      message.error('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#0d1117',
    }}>
      <div style={{ width: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            color: '#4ade80',
            fontSize: 28,
            fontWeight: 'bold',
            letterSpacing: 4,
            margin: 0,
          }}>
            脑力学院
          </h1>
          <p style={{ color: '#8b949e', marginTop: 8, fontSize: 14 }}>
            CS2 道具点位速查
          </p>
        </div>
        <Card
          style={{
            background: '#161b22',
            border: '1px solid #21262d',
          }}
        >
          <Form onFinish={handleSubmit} size="large">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证编译**

```bash
cd /Users/tony/Code/Utility_Lookup/frontend && npm run build
```

- [ ] **Step 3: 提交**

```bash
cd /Users/tony/Code/Utility_Lookup
git add frontend/src/components/LoginPage.tsx
git commit -m "feat: add login page with centered card layout"
```

---

### Task 5: 主布局 + Header + Sidebar

**Files:**
- Create: `frontend/src/components/MainLayout.tsx`
- Create: `frontend/src/components/Header.tsx`
- Create: `frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: 创建 Header.tsx**

```tsx
import { Popconfirm } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { UserResponse } from '../types';

interface HeaderProps {
  user: UserResponse;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 20px',
      height: 48,
      background: '#161b22',
      borderBottom: '1px solid #21262d',
    }}>
      <span style={{
        color: '#4ade80',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
      }}>
        脑力学院
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#8b949e', fontSize: 14 }}>{user.username}</span>
        <Popconfirm
          title="确认登出？"
          onConfirm={onLogout}
          okText="确认"
          cancelText="取消"
        >
          <span style={{
            color: '#8b949e',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <LogoutOutlined />
            登出
          </span>
        </Popconfirm>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 Sidebar.tsx**

```tsx
import { useState, useEffect } from 'react';
import { listMaps } from '../api/maps';
import { MapResponse } from '../types';

export const UTILITY_TYPES = [
  { value: 'smoke', label: '烟雾弹' },
  { value: 'flash', label: '闪光弹' },
  { value: 'molotov', label: '燃烧瓶' },
  { value: 'he', label: '手雷' },
] as const;

export const SIDES = [
  { value: 'ct', label: 'CT' },
  { value: 't', label: 'T' },
] as const;

interface SidebarProps {
  selectedMap: number | null;
  selectedUtility: string | null;
  selectedSide: string | null;
  onMapChange: (mapId: number | null) => void;
  onUtilityChange: (type: string | null) => void;
  onSideChange: (side: string | null) => void;
}

export default function Sidebar({
  selectedMap,
  selectedUtility,
  selectedSide,
  onMapChange,
  onUtilityChange,
  onSideChange,
}: SidebarProps) {
  const [maps, setMaps] = useState<MapResponse[]>([]);

  useEffect(() => {
    listMaps().then(setMaps);
  }, []);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 8px',
    borderRadius: 4,
    fontSize: 12,
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: active ? '#4ade80' : '#21262d',
    color: active ? '#0d1117' : '#c9d1d9',
    fontWeight: active ? 'bold' : 'normal',
    border: active ? 'none' : '1px solid #30363d',
  });

  const sectionLabel: React.CSSProperties = {
    color: '#8b949e',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  };

  return (
    <div style={{
      width: 200,
      flexShrink: 0,
      background: '#161b22',
      borderRight: '1px solid #21262d',
      padding: 16,
      overflowY: 'auto',
    }}>
      <div style={sectionLabel}>地图</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
        {maps.map((m) => (
          <div
            key={m.id}
            style={btnStyle(selectedMap === m.id)}
            onClick={() => onMapChange(selectedMap === m.id ? null : m.id)}
          >
            {m.display_name}
          </div>
        ))}
      </div>

      <div style={sectionLabel}>道具</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
        {UTILITY_TYPES.map((u) => (
          <div
            key={u.value}
            style={btnStyle(selectedUtility === u.value)}
            onClick={() => onUtilityChange(selectedUtility === u.value ? null : u.value)}
          >
            {u.label}
          </div>
        ))}
      </div>

      <div style={sectionLabel}>阵营</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {SIDES.map((s) => (
          <div
            key={s.value}
            style={{ ...btnStyle(selectedSide === s.value), flex: 1 }}
            onClick={() => onSideChange(selectedSide === s.value ? null : s.value)}
          >
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 MainLayout.tsx**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { UserResponse, LineupResponse } from '../types';
import { listLineups, getLineup } from '../api/lineups';
import Header from './Header';
import Sidebar from './Sidebar';
import LineupGrid from './LineupGrid';
import LineupDetail from './LineupDetail';

interface MainLayoutProps {
  user: UserResponse;
  onLogout: () => void;
}

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
  const [selectedMap, setSelectedMap] = useState<number | null>(null);
  const [selectedUtility, setSelectedUtility] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [lineups, setLineups] = useState<LineupResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedLineupId, setSelectedLineupId] = useState<number | null>(null);
  const [lineupDetail, setLineupDetail] = useState<LineupResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchLineups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLineups({
        map_id: selectedMap ?? undefined,
        utility_type: selectedUtility ?? undefined,
        side: selectedSide ?? undefined,
      });
      setLineups(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [selectedMap, selectedUtility, selectedSide]);

  useEffect(() => {
    fetchLineups();
  }, [fetchLineups]);

  const handleSelectLineup = async (id: number) => {
    setDetailLoading(true);
    setSelectedLineupId(id);
    try {
      const detail = await getLineup(id);
      setLineupDetail(detail);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedLineupId(null);
    setLineupDetail(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d1117' }}>
      <Header user={user} onLogout={onLogout} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          selectedMap={selectedMap}
          selectedUtility={selectedUtility}
          selectedSide={selectedSide}
          onMapChange={setSelectedMap}
          onUtilityChange={setSelectedUtility}
          onSideChange={setSelectedSide}
        />
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {selectedLineupId ? (
            <LineupDetail
              lineup={lineupDetail}
              loading={detailLoading}
              onBack={handleBack}
            />
          ) : (
            <LineupGrid
              lineups={lineups}
              total={total}
              loading={loading}
              onSelect={handleSelectLineup}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 验证编译**

```bash
cd /Users/tony/Code/Utility_Lookup/frontend && npm run build
```

- [ ] **Step 5: 提交**

```bash
cd /Users/tony/Code/Utility_Lookup
git add frontend/src/components/MainLayout.tsx frontend/src/components/Header.tsx frontend/src/components/Sidebar.tsx
git commit -m "feat: add main layout with header, sidebar filters, and content area"
```

---

### Task 6: 点位卡片网格 + 详情页

**Files:**
- Create: `frontend/src/components/LineupGrid.tsx`
- Create: `frontend/src/components/LineupCard.tsx`
- Create: `frontend/src/components/LineupDetail.tsx`

- [ ] **Step 1: 创建 LineupCard.tsx**

```tsx
import { LineupResponse } from '../types';
import { UTILITY_TYPES, SIDES } from './Sidebar';

interface LineupCardProps {
  lineup: LineupResponse;
  onClick: () => void;
}

export default function LineupCard({ lineup, onClick }: LineupCardProps) {
  const utilityLabel = UTILITY_TYPES.find((u) => u.value === lineup.utility_type)?.label ?? lineup.utility_type;
  const sideLabel = SIDES.find((s) => s.value === lineup.side)?.label ?? lineup.side;

  const thumbnail = lineup.media.find((m) => m.file_type === 'image');

  return (
    <div
      onClick={onClick}
      style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = '#4ade80';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#21262d';
      }}
    >
      <div style={{
        width: '100%',
        height: 120,
        background: '#21262d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {thumbnail ? (
          <img
            src={`/${thumbnail.file_path}`}
            alt={lineup.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: '#4ade80', fontSize: 12 }}>暂无图片</span>
        )}
      </div>
      <div style={{ padding: '8px 12px' }}>
        <div style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 'bold' }}>{lineup.name}</div>
        <div style={{ color: '#8b949e', fontSize: 12, marginTop: 4 }}>
          {sideLabel} | {utilityLabel}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 LineupGrid.tsx**

```tsx
import { Spin } from 'antd';
import { LineupResponse } from '../types';
import LineupCard from './LineupCard';

interface LineupGridProps {
  lineups: LineupResponse[];
  total: number;
  loading: boolean;
  onSelect: (id: number) => void;
}

export default function LineupGrid({ lineups, total, loading, onSelect }: LineupGridProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ color: '#c9d1d9', fontSize: 14, marginBottom: 16 }}>
        找到 {total} 个点位
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 16,
      }}>
        {lineups.map((lineup) => (
          <LineupCard
            key={lineup.id}
            lineup={lineup}
            onClick={() => onSelect(lineup.id)}
          />
        ))}
      </div>
      {lineups.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8b949e', padding: 80 }}>
          暂无匹配的道具点位
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 创建 LineupDetail.tsx**

```tsx
import { Spin, Carousel, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { LineupResponse } from '../types';
import { UTILITY_TYPES, SIDES } from './Sidebar';

interface LineupDetailProps {
  lineup: LineupResponse | null;
  loading: boolean;
  onBack: () => void;
}

export default function LineupDetail({ lineup, loading, onBack }: LineupDetailProps) {
  if (loading || !lineup) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const utilityLabel = UTILITY_TYPES.find((u) => u.value === lineup.utility_type)?.label ?? lineup.utility_type;
  const sideLabel = SIDES.find((s) => s.value === lineup.side)?.label ?? lineup.side;

  const images = lineup.media.filter((m) => m.file_type === 'image');
  const video = lineup.media.find((m) => m.file_type === 'video');

  return (
    <div>
      <div
        onClick={onBack}
        style={{
          color: '#4ade80',
          cursor: 'pointer',
          marginBottom: 16,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <ArrowLeftOutlined />
        返回列表
      </div>

      <h2 style={{ color: '#e0e0e0', margin: '0 0 8px 0' }}>{lineup.name}</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Tag color="green">{sideLabel}</Tag>
        <Tag>{utilityLabel}</Tag>
      </div>

      <div style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
      }}>
        {images.length > 1 ? (
          <Carousel autoplay>
            {images.map((m) => (
              <div key={m.id}>
                <img
                  src={`/${m.file_path}`}
                  alt=""
                  style={{ width: '100%', maxHeight: 400, objectFit: 'contain', background: '#21262d' }}
                />
              </div>
            ))}
          </Carousel>
        ) : images.length === 1 ? (
          <img
            src={`/${images[0].file_path}`}
            alt=""
            style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block' }}
          />
        ) : null}

        {video && (
          <video
            src={`/${video.file_path}`}
            controls
            style={{ width: '100%', maxHeight: 400, display: 'block' }}
          />
        )}

        {images.length === 0 && !video && (
          <div style={{ padding: 40, textAlign: 'center', color: '#8b949e' }}>
            暂无媒体文件
          </div>
        )}
      </div>

      {lineup.description && (
        <div style={{
          color: '#c9d1d9',
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 16,
          background: '#161b22',
          border: '1px solid #21262d',
          borderRadius: 8,
          padding: 16,
        }}>
          {lineup.description}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {lineup.pos_x != null && lineup.pos_y != null && (
          <span style={{ color: '#8b949e', fontSize: 12, background: '#21262d', padding: '4px 8px', borderRadius: 4 }}>
            坐标: ({lineup.pos_x}, {lineup.pos_y})
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 验证编译**

```bash
cd /Users/tony/Code/Utility_Lookup/frontend && npm run build
```

Expected: 编译成功

- [ ] **Step 5: 提交**

```bash
cd /Users/tony/Code/Utility_Lookup
git add frontend/src/components/LineupGrid.tsx frontend/src/components/LineupCard.tsx frontend/src/components/LineupDetail.tsx
git commit -m "feat: add lineup grid, card, and detail components"
```

---

### Task 7: 端到端验证

- [ ] **Step 1: 启动后端**

```bash
cd /Users/tony/Code/Utility_Lookup/backend
uvicorn app.main:app --reload --port 8000
```

- [ ] **Step 2: 启动前端**

```bash
cd /Users/tony/Code/Utility_Lookup/frontend
npm run dev
```

- [ ] **Step 3: 手动测试流程**

1. 访问 http://localhost:5173 → 应自动跳转到 `/login`
2. 输入 admin / admin123 → 点击登录 → 跳转到主页
3. 主页左侧显示地图/道具/阵营筛选按钮
4. 右侧显示卡片网格（含 mock 数据 "A大烟雾"）
5. 点击卡片 → 右侧替换为详情页
6. 点击 "返回列表" → 回到网格视图
7. 点击筛选按钮 → 列表随筛选条件更新
8. 点击登出 → 确认 → 跳转到登录页

- [ ] **Step 4: 最终提交**

```bash
cd /Users/tony/Code/Utility_Lookup
git add frontend/
git commit -m "feat: complete CS2 utility lookup frontend with login, filtering, and detail views"
```

---

## Self-Review

**Spec coverage:**
- [x] 登录页（居中卡片）→ Task 4
- [x] 暗夜绿色配色 → Task 3 (Ant Design theme)
- [x] Header（Logo + 用户名 + 登出）→ Task 5
- [x] Sidebar 筛选（地图/道具/阵营）→ Task 5
- [x] 卡片网格列表 → Task 6
- [x] 卡片 hover 抬升 + 边框变绿 → Task 6
- [x] 详情页（页面替换）→ Task 5 (MainLayout) + Task 6
- [x] 图片轮播 / 视频播放 → Task 6
- [x] 返回列表保留筛选状态 → Task 5 (MainLayout state)
- [x] 认证流程（token + 401 + 登出）→ Task 2 + Task 3
- [x] Vite 代理 → Task 1
- [x] Popconfirm 登出确认 → Task 5
- [x] 加载 Spin → Task 6

**Placeholder scan:** 无 TBD/TODO。

**Type consistency:** `LineupResponse`、`MapResponse` 等类型在 types.ts 定义，各组件引用一致。`UTILITY_TYPES`、`SIDES` 从 Sidebar 导出，LineupCard 和 LineupDetail 都使用。
