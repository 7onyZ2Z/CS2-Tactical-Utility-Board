import { useState, useEffect } from 'react';
import { listMaps } from '../api/maps';
import type { MapResponse } from '../types';

export const UTILITY_TYPES = [
  { value: 'smoke', label: '烟雾弹', icon: '/utility_icon/smokegrenade.png' },
  { value: 'flash', label: '闪光弹', icon: '/utility_icon/flashbang.png' },
  { value: 'molotov', label: '燃烧瓶', icon: '/utility_icon/molotov.png' },
  { value: 'he', label: '手雷', icon: '/utility_icon/hegrenade.png' },
] as const;

export const SIDES = [
  { value: 'ct', label: 'CT', icon: '/side_icon/ct.png' },
  { value: 't', label: 'T', icon: '/side_icon/t.png' },
] as const;

export const TACTIC_CATEGORIES = [
  { value: 'eco', label: 'ECO' },
  { value: 'force_buy', label: '强起' },
  { value: 'full_buy', label: '长枪' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  eco: '#f59e0b',
  force_buy: '#f97316',
  full_buy: '#3b82f6',
};

export const MAP_ICONS: Record<string, string> = {
  dust2: '/map_icon/de_dust2.png',
  mirage: '/map_icon/de_mirage.png',
  inferno: '/map_icon/de_inferno.png',
  nuke: '/map_icon/de_nuke.png',
  overpass: '/map_icon/de_overpass.png',
  ancient: '/map_icon/de_ancient.png',
  anubis: '/map_icon/de_anubis.png',
  vertigo: '/map_icon/de_vertigo.png',
  cache: '/map_icon/de_cache.png',
  train: '/map_icon/de_train.png',
};

interface SidebarProps {
  selectedMap: number | null;
  selectedUtility: string | null;
  selectedSide: string | null;
  view: 'lineups' | 'tactics';
  onMapChange: (mapId: number | null) => void;
  onUtilityChange: (type: string | null) => void;
  onSideChange: (side: string | null) => void;
}

export default function Sidebar({
  selectedMap,
  selectedUtility,
  selectedSide,
  view,
  onMapChange,
  onUtilityChange,
  onSideChange,
}: SidebarProps) {
  const [maps, setMaps] = useState<MapResponse[]>([]);

  useEffect(() => {
    listMaps().then(setMaps);
  }, []);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 6px',
    borderRadius: 4,
    fontSize: 11,
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: active ? '#4ade80' : '#21262d',
    color: active ? '#0d1117' : '#c9d1d9',
    fontWeight: active ? 'bold' : 'normal',
    border: active ? '1px solid #4ade80' : '1px solid #30363d',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  });

  const sectionLabel: React.CSSProperties = {
    color: '#8b949e',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  };

  return (
    <>
      <style>{`
        .sb-btn:hover { border-color: #4ade80 !important; }
      `}</style>
      <div style={{
        width: view === 'tactics' ? 76 : '25vw',
        minWidth: view === 'tactics' ? 76 : 240,
        maxWidth: view === 'tactics' ? 76 : 320,
        flexShrink: 0,
        background: '#161b22',
        borderRight: '1px solid #21262d',
        padding: view === 'tactics' ? 8 : 16,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: view === 'tactics' ? 'center' : undefined,
      }}>
        {view === 'tactics' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            {maps.map((m) => (
              <div
                key={m.id}
                className="sb-btn"
                style={{ ...btnStyle(selectedMap === m.id), width: '100%', boxSizing: 'border-box' }}
                onClick={() => onMapChange(selectedMap === m.id ? null : m.id)}
              >
                {MAP_ICONS[m.name] && (
                  <img
                    src={MAP_ICONS[m.name]}
                    alt={m.display_name}
                    style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 2 }}
                  />
                )}
                <span>{m.display_name}</span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div style={sectionLabel}>地图</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
              {maps.map((m) => (
                <div
                  key={m.id}
                  className="sb-btn"
                  style={btnStyle(selectedMap === m.id)}
                  onClick={() => onMapChange(selectedMap === m.id ? null : m.id)}
                >
                  {MAP_ICONS[m.name] && (
                    <img
                      src={MAP_ICONS[m.name]}
                      alt={m.display_name}
                      style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 2 }}
                    />
                  )}
                  <span>{m.display_name}</span>
                </div>
              ))}
            </div>

            <div style={sectionLabel}>道具</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
              {UTILITY_TYPES.map((u) => (
                <div
                  key={u.value}
                  className="sb-btn"
                  style={btnStyle(selectedUtility === u.value)}
                  onClick={() => onUtilityChange(selectedUtility === u.value ? null : u.value)}
                >
                  <img
                    src={u.icon}
                    alt={u.label}
                    style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 2 }}
                  />
                  <span>{u.label}</span>
                </div>
              ))}
            </div>

            <div style={sectionLabel}>阵营</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {SIDES.map((s) => (
                <div
                  key={s.value}
                  className="sb-btn"
                  style={{ ...btnStyle(selectedSide === s.value), flex: 1 }}
                  onClick={() => onSideChange(selectedSide === s.value ? null : s.value)}
                >
                  <img
                    src={s.icon}
                    alt={s.label}
                    style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 2 }}
                  />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
