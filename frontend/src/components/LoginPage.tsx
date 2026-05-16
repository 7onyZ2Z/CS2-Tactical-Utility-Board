import { useState } from 'react';
import { Form, Input, Button, Card, ConfigProvider, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

const WARM = {
  sand: '#d4a853',
  cream: '#f5ead6',
  brown: '#b8956a',
  cardBg: 'rgba(56, 42, 28, 0.38)',
  cardBorder: '#6b5640',
  inputBg: 'rgba(245, 234, 214, 0.08)',
  inputBorder: '#7a644a',
  inputText: '#f5ead6',
  placeholder: '#b8956a',
};

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
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: WARM.sand,
          colorBgContainer: WARM.inputBg,
          colorBorder: WARM.inputBorder,
          colorText: WARM.inputText,
          colorTextPlaceholder: WARM.placeholder,
          colorTextDescription: WARM.brown,
        },
      }}
    >
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        overflow: 'hidden',
        background: '#1a1612',
      }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        >
          <source src="/cs2_header.webm" type="video/webm" />
        </video>
        <div style={{ position: 'relative', zIndex: 1, width: 360 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{
              color: WARM.sand,
              fontSize: 28,
              fontWeight: 'bold',
              letterSpacing: 4,
              margin: 0,
            }}>
              学院CS
            </h1>
            <p style={{ color: WARM.brown, marginTop: 8, fontSize: 14 }}>
              CS2 战术｜道具 平台
            </p>
          </div>
          <Card style={{
            background: WARM.cardBg,
            border: `1px solid ${WARM.cardBorder}`,
            backdropFilter: 'blur(12px)',
            boxShadow: `0 4px 24px rgba(0,0,0,0.3)`,
          }}>
            <Form onFinish={handleSubmit} size="large">
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input
                  prefix={<UserOutlined style={{ color: WARM.brown }} />}
                  placeholder="用户名"
                  style={{
                    background: WARM.inputBg,
                    borderColor: WARM.inputBorder,
                    color: WARM.inputText,
                  }}
                />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: WARM.brown }} />}
                  placeholder="密码"
                  style={{
                    background: WARM.inputBg,
                    borderColor: WARM.inputBorder,
                    color: WARM.inputText,
                  }}
                />
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
    </ConfigProvider>
  );
}
