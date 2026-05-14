import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button, Input } from 'antd';
import type { MapResponse, PositionData } from '../types';

const MULTI_LEVEL_MAPS = new Set(['nuke', 'vertigo', 'train']);
const POS_COLORS = ['#4ade80', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa'];

function getRadarUrl(mapName: string, z: number): string {
  if (MULTI_LEVEL_MAPS.has(mapName)) {
    return z === 0 ? `/radar/de_${mapName}_upper.webp` : `/radar/de_${mapName}_lower.webp`;
  }
  return `/radar/de_${mapName}.webp`;
}

interface Props {
  open: boolean;
  map: MapResponse | null;
  onConfirm: (positions: Record<string, PositionData | null>) => void;
  onCancel: () => void;
}

export default function PositionPicker({ open, map, onConfirm, onCancel }: Props) {
  const [z, setZ] = useState(0);
  const [positions, setPositions] = useState<Record<number, PositionData | null>>({});
  const [dragging, setDragging] = useState<number | null>(null);
  const radarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setPositions({});
      setZ(0);
      setDragging(null);
    }
  }, [open]);

  const isMultiLevel = map ? MULTI_LEVEL_MAPS.has(map.name) : false;
  const radarUrl = map ? getRadarUrl(map.name, z) : '';

  const handleMouseDown = (e: React.MouseEvent, posNum: number) => {
    e.preventDefault();
    setDragging(posNum);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragging === null || !radarRef.current) return;
      const rect = radarRef.current.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
      if (x < 0 || x > 100 || y < 0 || y > 100) return;
      setPositions((prev) => ({ ...prev, [dragging]: { x, y, z, duty: prev[dragging]?.duty } }));
    },
    [dragging, z],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleDutyChange = (posNum: number, value: string) => {
    setPositions((prev) => {
      const existing = prev[posNum];
      if (!existing) return prev;
      return { ...prev, [posNum]: { ...existing, duty: value || undefined } };
    });
  };

  const handleConfirm = () => {
    const result: Record<string, PositionData | null> = {};
    for (let i = 1; i <= 5; i++) {
      result[i] = positions[i] ?? null;
    }
    onConfirm(result);
  };

  const assignedCount = Object.values(positions).filter(Boolean).length;

  return (
    <Modal
      title={map ? `位置分配 — ${map.display_name}` : '位置分配'}
      open={open}
      onCancel={onCancel}
      centered
      width="auto"
      footer={[
        <Button key="clear" onClick={() => setPositions({})}>清除全部</Button>,
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button key="ok" type="primary" onClick={handleConfirm}>
          确定 ({assignedCount}/5)
        </Button>,
      ]}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {isMultiLevel && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" type={z === 0 ? 'primary' : 'default'} onClick={() => { setZ(0); setPositions({}); }}>上层</Button>
            <Button size="small" type={z === 1 ? 'primary' : 'default'} onClick={() => { setZ(1); setPositions({}); }}>下层</Button>
          </div>
        )}
        <span style={{ color: '#8b949e', fontSize: 13 }}>拖动右侧数字到雷达图上分配位置</span>
      </div>
      <div style={{ display: 'flex' }}>
        <div
          ref={radarRef}
          style={{
            flex: 1,
            width: 'min(calc(100vw - 200px), calc(100vh - 260px))',
            height: 'min(calc(100vw - 200px), calc(100vh - 260px))',
            position: 'relative',
            background: '#0d1117',
            userSelect: 'none',
          }}
        >
          <img
            src={radarUrl}
            alt="radar"
            draggable={false}
            loading="lazy"
            style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
          />
          {Object.entries(positions).map(([, pos]) => {
            if (!pos) return null;
            const num = Number(Object.keys(positions).find((k) => positions[Number(k)] === pos));
            return (
              <div
                key={num}
                onMouseDown={(e) => handleMouseDown(e, num)}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: POS_COLORS[num - 1],
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: 9,
                  cursor: 'grab',
                  boxShadow: `0 0 6px ${POS_COLORS[num - 1]}80`,
                  border: '1.5px solid #fff',
                  zIndex: 10,
                }}
              >
                {num}
              </div>
            );
          })}
        </div>
        <div style={{
          width: 150,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '8px 10px',
          background: '#161b22',
          borderLeft: '1px solid #21262d',
        }}>
          {[1, 2, 3, 4, 5].map((num) => {
            const placed = !!positions[num];
            return (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  onMouseDown={(e) => !placed && handleMouseDown(e, num)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: placed ? '#30363d' : POS_COLORS[num - 1],
                    color: placed ? '#8b949e' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 10,
                    cursor: placed ? 'default' : 'grab',
                    border: `1.5px solid ${POS_COLORS[num - 1]}`,
                    opacity: placed ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {num}
                </div>
                <Input
                  size="small"
                  placeholder="职责"
                  value={positions[num]?.duty ?? ''}
                  disabled={!placed}
                  onChange={(e) => handleDutyChange(num, e.target.value)}
                  style={{
                    width: 0,
                    flex: 1,
                    background: '#0d1117',
                    borderColor: '#30363d',
                    color: '#c9d1d9',
                    fontSize: 11,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
