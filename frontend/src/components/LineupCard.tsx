import type { LineupResponse, MapResponse } from '../types';
import { UTILITY_TYPES, SIDES, MAP_ICONS } from './Sidebar';

const SIDE_COLORS: Record<string, string> = { ct: '#4a90d9', t: '#d4a853' };
const UTILITY_COLORS: Record<string, string> = { smoke: '#d4a853', flash: '#e8e8e8', molotov: '#e05540', he: '#b895c0' };

interface LineupCardProps {
  lineup: LineupResponse;
  maps: MapResponse[];
  onClick: () => void;
}

export default function LineupCard({ lineup, maps, onClick }: LineupCardProps) {
  const utilityLabel = UTILITY_TYPES.find((u) => u.value === lineup.utility_type)?.label ?? lineup.utility_type;
  const sideLabel = SIDES.find((s) => s.value === lineup.side)?.label ?? lineup.side;
  const thumbnail = lineup.media.find((m) => m.file_type === 'image');
  const mapInfo = maps.find((m) => m.id === lineup.map_id);
  const mapIcon = mapInfo ? MAP_ICONS[mapInfo.name] : null;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#221d18',
        border: '1px solid #3d3628',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = '#d4a853';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#3d3628';
      }}
    >
      <div style={{
        width: '100%',
        height: 120,
        background: '#3d3628',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {thumbnail ? (
          <img
            src={`/${thumbnail.file_path}`}
            alt={lineup.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: '#d4a853', fontSize: 12 }}>暂无图片</span>
        )}
      </div>
      <div style={{ padding: '8px 12px' }}>
        <div style={{ color: '#f5ead6', fontSize: 14, fontWeight: 'bold' }}>{lineup.name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              color: SIDE_COLORS[lineup.side] ?? '#b8956a',
              background: `${SIDE_COLORS[lineup.side] ?? '#b8956a'}20`,
              padding: '0px 5px',
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 'bold',
              lineHeight: '18px',
            }}>{sideLabel}</span>
            <span style={{ color: UTILITY_COLORS[lineup.utility_type] ?? '#b8956a', fontWeight: 'bold' }}>{utilityLabel}</span>
          </span>
          {mapInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {mapIcon && <img src={mapIcon} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />}
              <span style={{ color: '#b8956a', fontSize: 11 }}>{mapInfo.display_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
