import { Spin, Carousel, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { LineupResponse } from '../types';
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
