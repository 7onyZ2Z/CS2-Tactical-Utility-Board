import { useState, useEffect } from 'react';
import { listMaps } from '../api/maps';
import type { MapResponse } from '../types';

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
