import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button, Input } from 'antd';
import type { MapResponse, PositionData } from '../types';

const MULTI_LEVEL_MAPS = new Set(['nuke', 'vertigo', 'train']);
const POS_COLORS = ['#d4a853', '#f0a060', '#e8c840', '#e07060', '#c4a0e0'];

function getRadarUrl(mapName: string, z: number): string {
  if (MULTI_LEVEL_MAPS.has(mapName)) {
    return z === 0 ? `/radar/de_${mapName}_upper.webp` : `/radar/de_${mapName}_lower.webp`;
  }
  return `/radar/de_${mapName}.webp`;
}

interface Props {
  open: boolean;
  map: MapResponse | null;
  initialPositions?: Record<string, PositionData | null> | null;
  onConfirm: (positions: Record<string, PositionData | null>) => void;
  onCancel: () => void;
}

function toNumberPositions(p: Record<string, PositionData | null> | null | undefined): Record<number, PositionData | null> {
  const result: Record<number, PositionData | null> = {};
  if (!p) return result;
  for (const key of Object.keys(p)) {
    const num = Number(key);
    if (num >= 1 && num <= 5) result[num] = p[key];
  }
  return result;
}

export default function PositionPicker({ open, map, initialPositions, onConfirm, onCancel }: Props) {
  const [z, setZ] = useState(0);
  const [positions, setPositions] = useState<Record<number, PositionData | null>>({});
  const [dragging, setDragging] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [dutyEditNum, setDutyEditNum] = useState<number | null>(null);
  const dutyEditRef = useRef<number | null>(null);
  const radarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setPositions(toNumberPositions(initialPositions));
      setZ(0);
      setDragging(null);
      setConfirmed(false);
    }
  }, [open]);

  useEffect(() => {
    setConfirmed(false);
  }, [z]);

  const isMultiLevel = map ? MULTI_LEVEL_MAPS.has(map.name) : false;
  const radarUrl = map ? getRadarUrl(map.name, z) : '';

  const handleMouseDown = (e: React.MouseEvent, posNum: number) => {
    if (confirmed) return;
    e.preventDefault();
    setDragging(posNum);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragging === null || !radarRef.current || confirmed) return;
      const rect = radarRef.current.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
      if (x < 0 || x > 100 || y < 0 || y > 100) return;
      setPositions((prev) => ({ ...prev, [dragging]: { x, y, z, duty: prev[dragging]?.duty } }));
    },
    [dragging, z, confirmed],
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

  const handleConfirmPlacement = () => {
    setConfirmed(true);
  };

  const handleFinish = () => {
    const result: Record<string, PositionData | null> = {};
    for (let i = 1; i <= 5; i++) {
      result[i] = positions[i] ?? null;
    }
    onConfirm(result);
  };

  const handleDutySave = (value: string) => {
    const num = dutyEditRef.current;
    if (num === null) return;
    setPositions((prev) => {
      const existing = prev[num];
      if (!existing) return prev;
      return { ...prev, [num]: { ...existing, duty: value || undefined } };
    });
    setDutyEditNum(null);
    dutyEditRef.current = null;
  };

  const assignedCount = Object.values(positions).filter(Boolean).length;

  return (
    <Modal
      title={map ? `位置分配 — ${map.display_name}` : '位置分配'}
      open={open}
      onCancel={onCancel}
      centered
      zIndex={1050}
      width="auto"
      footer={
        confirmed
          ? [
              <Button key="back" onClick={() => setConfirmed(false)}>返回调整</Button>,
              <Button key="cancel" onClick={onCancel}>取消</Button>,
              <Button key="finish" type="primary" onClick={handleFinish}>完成</Button>,
            ]
          : [
              <Button key="clear" onClick={() => setPositions({})}>清除全部</Button>,
              <Button key="cancel" onClick={onCancel}>取消</Button>,
              <Button key="ok" type="primary" disabled={assignedCount === 0} onClick={handleConfirmPlacement}>
                确定 ({assignedCount}/5)
              </Button>,
            ]
      }
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {isMultiLevel && !confirmed && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" type={z === 0 ? 'primary' : 'default'} onClick={() => { setZ(0); setPositions({}); }}>上层</Button>
            <Button size="small" type={z === 1 ? 'primary' : 'default'} onClick={() => { setZ(1); setPositions({}); }}>下层</Button>
          </div>
        )}
        <span style={{ color: '#b8956a', fontSize: 13 }}>
          {confirmed ? '点击位置标记设置职责' : '拖动右侧数字到雷达图上分配位置'}
        </span>
      </div>
      <div style={{ display: 'flex' }}>
        <div
          ref={radarRef}
          style={{
            flex: 1,
            width: 'min(calc(100vw - 200px), calc(100vh - 260px))',
            height: 'min(calc(100vw - 200px), calc(100vh - 260px))',
            position: 'relative',
            background: '#1a1612',
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
                onMouseDown={(e) => confirmed ? undefined : handleMouseDown(e, num)}
                onClick={() => { if (confirmed) { dutyEditRef.current = num; setDutyEditNum(num); } }}
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
                  cursor: confirmed ? 'pointer' : 'grab',
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
          width: 60,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '8px 10px',
          background: '#221d18',
          borderLeft: '1px solid #3d3628',
        }}>
          {[1, 2, 3, 4, 5].map((num) => {
            const placed = !!positions[num];
            return (
              <div key={num} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div
                  onMouseDown={(e) => !placed && !confirmed && handleMouseDown(e, num)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: placed ? '#4a3d2e' : POS_COLORS[num - 1],
                    color: placed ? '#b8956a' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 10,
                    cursor: placed || confirmed ? 'default' : 'grab',
                    border: `1.5px solid ${POS_COLORS[num - 1]}`,
                    opacity: placed ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {num}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        title={`${dutyEditNum}号位职责`}
        open={dutyEditNum !== null}
        onCancel={() => { setDutyEditNum(null); dutyEditRef.current = null; }}
        onOk={() => {
          const input = document.getElementById('duty-input') as HTMLInputElement;
          handleDutySave(input?.value ?? '');
        }}
        okText="确定"
        cancelText="取消"
        width={300}
        destroyOnClose
      >
        <Input
          id="duty-input"
          autoFocus
          placeholder="如：投掷A大闪光，后续为1号位补枪"
          defaultValue={dutyEditNum !== null ? positions[dutyEditNum]?.duty ?? '' : ''}
          onPressEnter={(e) => handleDutySave((e.target as HTMLInputElement).value)}
        />
      </Modal>
    </Modal>
  );
}
