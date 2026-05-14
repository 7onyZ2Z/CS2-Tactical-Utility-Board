import { Popconfirm } from 'antd';
import { LogoutOutlined, SwapOutlined } from '@ant-design/icons';
import type { UserResponse } from '../types';

interface HeaderProps {
  user: UserResponse;
  view: 'lineups' | 'tactics';
  onViewChange: (view: 'lineups' | 'tactics') => void;
  onLogout: () => void;
}

export default function Header({ user, view, onViewChange, onLogout }: HeaderProps) {
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
      <span
        onClick={() => onViewChange(view === 'tactics' ? 'lineups' : 'tactics')}
        style={{
          color: '#4ade80',
          fontSize: 18,
          fontWeight: 'bold',
          letterSpacing: 2,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'opacity 0.2s',
        }}
      >
        {view === 'tactics' ? '战术学院' : '道具学院'}
        <SwapOutlined style={{ fontSize: 12, opacity: 0.5 }} />
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#8b949e', fontSize: 14 }}>{user.username}</span>
        <Popconfirm title="确认登出？" onConfirm={onLogout} okText="确认" cancelText="取消">
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
