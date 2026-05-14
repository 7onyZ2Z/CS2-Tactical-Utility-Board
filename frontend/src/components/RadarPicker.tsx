import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button, Slider } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, AimOutlined } from '@ant-design/icons';
import type { MapResponse } from '../types';

const MULTI_LEVEL_MAPS = new Set(['nuke', 'vertigo', 'train']);
const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.1;

function getRadarUrl(mapName: string, z: number): string {
  if (MULTI_LEVEL_MAPS.has(mapName)) {
    return z === 0
      ? `/radar/de_${mapName}_upper.png`
      : `/radar/de_${mapName}_lower.png`;
  }
  return `/radar/de_${mapName}.png`;
}

interface Props {
  open: boolean;
  map: MapResponse | null;
  onConfirm: (x: number, y: number, z: number) => void;
  onCancel: () => void;
}

export default function RadarPicker({ open, map, onConfirm, onCancel }: Props) {
  const [z, setZ] = useState(0);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ mx: number; my: number; sx: number; sy: number } | null>(null);

  useEffect(() => {
    if (open) {
      setMarker(null);
      setZ(0);
      setZoom(1);
    }
  }, [open]);

  useEffect(() => {
    setMarker(null);
  }, [z]);

  const getCoord = useCallback(
    (clientX: number, clientY: number) => {
      const c = containerRef.current;
      if (!c) return null;
      const rect = c.getBoundingClientRect();
      const x = (clientX - rect.left + c.scrollLeft) / (rect.width * zoom);
      const y = (clientY - rect.top + c.scrollTop) / (rect.height * zoom);
      if (x < 0 || x > 1 || y < 0 || y > 1) return null;
      return { x: Math.round(x * 1000) / 10, y: Math.round(y * 1000) / 10 };
    },
    [zoom],
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 2) return;
    e.preventDefault();
    const c = containerRef.current;
    if (!c) return;
    panStart.current = { mx: e.clientX, my: e.clientY, sx: c.scrollLeft, sy: c.scrollTop };
    setPanning(true);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!panStart.current) return;
      const dx = e.clientX - panStart.current.mx;
      const dy = e.clientY - panStart.current.my;
      const c = containerRef.current;
      if (c) {
        c.scrollLeft = panStart.current.sx - dx;
        c.scrollTop = panStart.current.sy - dy;
      }
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    panStart.current = null;
    setPanning(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panStart.current) return;
    const coord = getCoord(e.clientX, e.clientY);
    if (coord) setMarker(coord);
  };

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((prev) => {
        const next = prev - e.deltaY * 0.005;
        return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(next * 10) / 10));
      });
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  }, []);

  const handleConfirm = () => {
    if (marker) {
      onConfirm(marker.x, marker.y, z);
    }
  };

  const isMultiLevel = map ? MULTI_LEVEL_MAPS.has(map.name) : false;
  const radarUrl = map ? getRadarUrl(map.name, z) : '';

  return (
    <Modal
      title={map ? `选择爆点 — ${map.display_name}` : '选择爆点'}
      open={open}
      onCancel={onCancel}
      centered
      footer={[
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button key="confirm" type="primary" disabled={!marker} onClick={handleConfirm}>
          确定
        </Button>,
      ]}
      styles={{ body: { padding: 0 } }}
      width="auto"
    >
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {isMultiLevel && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" type={z === 0 ? 'primary' : 'default'} onClick={() => setZ(0)}>
              上层
            </Button>
            <Button size="small" type={z === 1 ? 'primary' : 'default'} onClick={() => setZ(1)}>
              下层
            </Button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Button size="small" icon={<ZoomOutOutlined />} disabled={zoom <= ZOOM_MIN} onClick={() => setZoom((v) => Math.max(ZOOM_MIN, v - ZOOM_STEP))} />
          <Slider
            style={{ width: 100, margin: 0 }}
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={zoom}
            onChange={setZoom}
            tooltip={{ formatter: (v) => `${Math.round((v ?? 1) * 100)}%` }}
          />
          <Button size="small" icon={<ZoomInOutlined />} disabled={zoom >= ZOOM_MAX} onClick={() => setZoom((v) => Math.min(ZOOM_MAX, v + ZOOM_STEP))} />
        </div>
        {marker && (
          <span style={{ color: '#8b949e', fontSize: 13 }}>
            <AimOutlined style={{ marginRight: 4 }} />
            ({marker.x.toFixed(1)}, {marker.y.toFixed(1)}) {isMultiLevel ? (z === 0 ? '上层' : '下层') : ''}
          </span>
        )}
        {!marker && (
          <span style={{ color: '#8b949e', fontSize: 13 }}>左键选择爆点 · 滚轮缩放 · 右键拖动</span>
        )}
      </div>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{
          width: 'min(calc(100vw - 80px), calc(100vh - 260px))',
          height: 'min(calc(100vw - 80px), calc(100vh - 260px))',
          cursor: panning ? 'grabbing' : 'crosshair',
          overflow: 'auto',
          background: '#0d1117',
          userSelect: 'none',
        }}
      >
        <div style={{
          width: `${zoom * 100}%`,
          height: `${zoom * 100}%`,
          position: 'relative',
        }}>
          <img
            src={radarUrl}
            alt="radar"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
          {marker && (
            <div
              style={{
                position: 'absolute',
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                transform: 'translate(-50%, -50%)',
                width: Math.max(16 / zoom, 8),
                height: Math.max(16 / zoom, 8),
                borderRadius: '50%',
                background: '#4ade80',
                border: '2px solid #fff',
                boxShadow: '0 0 8px rgba(74,222,128,0.6)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
