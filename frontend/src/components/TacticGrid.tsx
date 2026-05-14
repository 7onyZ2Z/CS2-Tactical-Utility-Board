import { useState, useEffect } from 'react';
import { Spin, Button, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, AimOutlined } from '@ant-design/icons';
import type { TacticResponse, MapResponse, PositionData } from '../types';
import { listTactics, createTactic } from '../api/tactics';
import { listMaps } from '../api/maps';
import { MAP_ICONS, TACTIC_CATEGORIES, CATEGORY_COLORS } from './Sidebar';
import PositionPicker from './PositionPicker';

interface TacticGridProps {
  selectedMap: number | null;
  canCreate: boolean;
  onSelect: (tactic: TacticResponse) => void;
}

export default function TacticGrid({ selectedMap, canCreate, onSelect }: TacticGridProps) {
  const [tactics, setTactics] = useState<TacticResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [maps, setMaps] = useState<MapResponse[]>([]);
  const [posPickerOpen, setPosPickerOpen] = useState(false);
  const [selectedMapForPos, setSelectedMapForPos] = useState<MapResponse | null>(null);
  const [positions, setPositions] = useState<Record<string, PositionData | null> | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    setLoading(true);
    listTactics(selectedMap ?? undefined)
      .then(setTactics)
      .finally(() => setLoading(false));
  }, [selectedMap]);

  useEffect(() => {
    listMaps().then(setMaps);
  }, []);

  const handleCreate = async (values: { name: string; category: string; description?: string; map_id: number }) => {
    setConfirmLoading(true);
    try {
      await createTactic({ ...values, positions });
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      setPositions(null);
      setSelectedMapForPos(null);
      listTactics(selectedMap ?? undefined).then(setTactics);
    } catch {
      message.error('创建失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const getMapIcon = (mapId: number) => {
    const m = maps.find((m) => m.id === mapId);
    return m ? MAP_ICONS[m.name] : null;
  };

  const getMapName = (mapId: number) => {
    return maps.find((m) => m.id === mapId)?.display_name ?? '';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ color: '#c9d1d9', fontSize: 14 }}>找到 {tactics.length} 个战术</span>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新增战术
          </Button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
      }}>
        {tactics.map((t, i) => {
          const icon = getMapIcon(t.map_id);
          return (
            <div
              key={t.id}
              className="anim-fade-in-up"
              onClick={() => onSelect(t)}
              style={{
                animationDelay: `${i * 50}ms`,
                cursor: 'pointer',
                background: '#161b22',
                border: '1px solid #21262d',
                borderRadius: 8,
                padding: 16,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#4ade80';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#21262d';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 'bold' }}>{t.name}</span>
                    <span style={{
                      color: CATEGORY_COLORS[t.category] ?? '#8b949e',
                      fontSize: 11,
                      background: `${CATEGORY_COLORS[t.category] ?? '#8b949e'}20`,
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontWeight: 'bold',
                    }}>
                      {TACTIC_CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {icon && <img src={icon} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />}
                  <span style={{ color: '#8b949e', fontSize: 12 }}>{getMapName(t.map_id)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tactics.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8b949e', padding: 80 }}>
          暂无战术，点击右上角创建
        </div>
      )}

      <Modal
        title="新增战术"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={confirmLoading}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="战术名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：A区默认烟" />
          </Form.Item>
          <Form.Item name="description" label="战术描述">
            <Input.TextArea rows={2} placeholder="战术整体说明（可选）" />
          </Form.Item>
          <Form.Item name="category" label="战术分类" rules={[{ required: true, message: '请选择分类' }]} initialValue="full_buy">
            <Select placeholder="选择分类">
              {TACTIC_CATEGORIES.map((c) => (
                <Select.Option key={c.value} value={c.value}>{c.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="map_id" label="地图" rules={[{ required: true, message: '请选择地图' }]}>
            <Select
              placeholder="选择地图"
              onChange={(val: number) => {
                const m = maps.find((m) => m.id === val) ?? null;
                setSelectedMapForPos(m);
                setPositions(null);
              }}
            >
              {maps.map((m) => (
                <Select.Option key={m.id} value={m.id}>{m.display_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="位置分配">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button
                icon={<AimOutlined />}
                disabled={!selectedMapForPos}
                onClick={() => setPosPickerOpen(true)}
              >
                {positions ? '已分配 — 重新选择' : '分配位置'}
              </Button>
              {!selectedMapForPos && <span style={{ color: '#8b949e', fontSize: 12 }}>请先选择地图</span>}
            </div>
          </Form.Item>
        </Form>
      </Modal>
      <PositionPicker
        open={posPickerOpen}
        map={selectedMapForPos}
        onConfirm={(pos) => {
          setPositions(pos);
          setPosPickerOpen(false);
        }}
        onCancel={() => setPosPickerOpen(false)}
      />
    </div>
  );
}
