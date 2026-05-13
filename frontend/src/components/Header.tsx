import { Popconfirm } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import type { UserResponse } from '../types';

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
      <span style={{ color: '#4ade80', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 }}>
        脑力学院
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
