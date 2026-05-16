import { useState, useEffect } from 'react';
import { listMaps } from '../api/maps';
import { getLineupCounts } from '../api/lineups';
import { getTacticCounts } from '../api/tactics';
import type { MapResponse, LineupCountsResponse, TacticCountsResponse } from '../types';
import { ClearOutlined } from '@ant-design/icons';

export const UTILITY_TYPES = [
  { value: 'smoke', label: '烟雾弹', icon: '/utility_icon/smokegrenade.webp' },
  { value: 'flash', label: '闪光弹', icon: '/utility_icon/flashbang.webp' },
  { value: 'molotov', label: '燃烧瓶', icon: '/utility_icon/molotov.webp' },
  { value: 'he', label: '手雷', icon: '/utility_icon/hegrenade.webp' },
] as const;

export const SIDES = [
  { value: 'ct', label: 'CT', icon: '/side_icon/ct.webp' },
  { value: 't', label: 'T', icon: '/side_icon/t.webp' },
] as const;

export const TACTIC_CATEGORIES = [
  { value: 'eco', label: 'ECO' },
  { value: 'force_buy', label: '强起' },
  { value: 'full_buy', label: '长枪' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  eco: '#f59e0b',
  force_buy: '#f97316',
  full_buy: '#689d6a',
};

export const MAP_ICONS: Record<string, string> = {
  dust2: '/map_icon/de_dust2.webp',
  mirage: '/map_icon/de_mirage.webp',
  inferno: '/map_icon/de_inferno.webp',
  nuke: '/map_icon/de_nuke.webp',
  overpass: '/map_icon/de_overpass.webp',
  ancient: '/map_icon/de_ancient.webp',
  anubis: '/map_icon/de_anubis.webp',
  vertigo: '/map_icon/de_vertigo.webp',
  cache: '/map_icon/de_cache.webp',
  train: '/map_icon/de_train.webp',
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
  const [lineupCounts, setLineupCounts] = useState<LineupCountsResponse>({ maps: {}, utilities: {}, sides: {} });
  const [tacticCounts, setTacticCounts] = useState<TacticCountsResponse>({ maps: {} });

  useEffect(() => {
    listMaps().then(setMaps);
  }, []);

  useEffect(() => {
    if (view === 'lineups') {
      getLineupCounts({
        map_id: selectedMap ?? undefined,
        utility_type: selectedUtility ?? undefined,
        side: selectedSide ?? undefined,
      }).then(setLineupCounts);
    } else {
      getTacticCounts(selectedMap ?? undefined).then(setTacticCounts);
    }
  }, [view, selectedMap, selectedUtility, selectedSide]);

  const counts = view === 'lineups' ? lineupCounts : { maps: tacticCounts.maps, utilities: {}, sides: {} };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 6px',
    borderRadius: 4,
    fontSize: 11,
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: active ? '#d4a853' : '#3d3628',
    color: active ? '#1a1612' : '#f5ead6',
    fontWeight: active ? 'bold' : 'normal',
    border: active ? '1px solid #d4a853' : '1px solid #4a3d2e',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    position: 'relative',
  });

  const countBadge = (n: number): React.CSSProperties => ({
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    background: 'rgba(0,0,0,0.55)',
    color: '#f5ead6',
    fontSize: 9,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
    lineHeight: '14px',
  });

  const sectionLabel: React.CSSProperties = {
    color: '#b8956a',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  };

  return (
    <>
      <style>{`
        .sb-btn:hover { border-color: #d4a853 !important; }
      `}</style>
      <div style={{
        width: view === 'tactics' ? 76 : '13vw',
        minWidth: view === 'tactics' ? 76 : 150,
        maxWidth: view === 'tactics' ? 76 : 200,
        flexShrink: 0,
        background: '#221d18',
        borderRight: '1px solid #3d3628',
        padding: view === 'tactics' ? 8 : 10,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: view === 'tactics' ? 'center' : undefined,
      }}>
        {view === 'tactics' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            {maps.map((m) => {
              const n = counts.maps[String(m.id)] ?? 0;
              return (
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
                {n > 0 && <span style={countBadge(n)}>{n}</span>}
              </div>
              );
            })}
          </div>
        ) : (
          <>
            <div style={sectionLabel}>地图</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 12 }}>
              {maps.map((m) => {
                const n = counts.maps[String(m.id)] ?? 0;
                return (
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
                      style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 2 }}
                    />
                  )}
                  <span style={{ fontSize: 10 }}>{m.display_name}</span>
                  {n > 0 && <span style={countBadge(n)}>{n}</span>}
                </div>
                );
              })}
            </div>

            <div style={sectionLabel}>阵营</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 12 }}>
              {SIDES.map((s) => {
                const n = counts.sides[s.value] ?? 0;
                return (
                <div
                  key={s.value}
                  className="sb-btn"
                  style={btnStyle(selectedSide === s.value)}
                  onClick={() => onSideChange(selectedSide === s.value ? null : s.value)}
                >
                  <img
                    src={s.icon}
                    alt={s.label}
                    style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 2 }}
                  />
                  <span style={{ fontSize: 10 }}>{s.label}</span>
                  {n > 0 && <span style={countBadge(n)}>{n}</span>}
                </div>
                );
              })}
            </div>

            <div style={sectionLabel}>道具</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {UTILITY_TYPES.map((u) => {
                const n = counts.utilities[u.value] ?? 0;
                return (
                <div
                  key={u.value}
                  className="sb-btn"
                  style={btnStyle(selectedUtility === u.value)}
                  onClick={() => onUtilityChange(selectedUtility === u.value ? null : u.value)}
                >
                  <img
                    src={u.icon}
                    alt={u.label}
                    style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 2 }}
                  />
                  <span style={{ fontSize: 10 }}>{u.label}</span>
                  {n > 0 && <span style={countBadge(n)}>{n}</span>}
                </div>
                );
              })}
            </div>

            {(selectedMap || selectedUtility || selectedSide) && (
              <div
                onClick={() => { onMapChange(null); onUtilityChange(null); onSideChange(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  marginTop: 4,
                  padding: '6px 0',
                  borderRadius: 4,
                  cursor: 'pointer',
                  color: '#b8956a',
                  fontSize: 12,
                  border: '1px solid #4a3d2e',
                  background: 'transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#d4a853';
                  e.currentTarget.style.borderColor = '#d4a853';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#b8956a';
                  e.currentTarget.style.borderColor = '#4a3d2e';
                }}
              >
                <ClearOutlined />
                重置筛选
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
