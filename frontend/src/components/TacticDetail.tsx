import { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, Select, Upload, message, Tabs, Checkbox } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, UploadOutlined, AimOutlined, DeleteOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import type { TacticResponse, MapResponse, LineupResponse, TacticAssignment, PositionData } from '../types';
import { listLineups, createLineup, updateLineup, uploadMedia } from '../api/lineups';
import { listMaps } from '../api/maps';
import { deleteTactic, updateTactic } from '../api/tactics';
import { UTILITY_TYPES, SIDES, MAP_ICONS, TACTIC_CATEGORIES, CATEGORY_COLORS } from './Sidebar';
import LineupCard from './LineupCard';
import RadarPicker from './RadarPicker';
import PositionPicker from './PositionPicker';

const POS_COLORS = ['#d4a853', '#f0a060', '#e8c840', '#e07060', '#c4a0e0'];
const MULTI_LEVEL_MAPS = new Set(['nuke', 'vertigo', 'train']);

function getRadarUrl(mapName: string, z: number): string {
  if (MULTI_LEVEL_MAPS.has(mapName)) {
    return z === 0 ? `/radar/de_${mapName}_upper.webp` : `/radar/de_${mapName}_lower.webp`;
  }
  return `/radar/de_${mapName}.webp`;
}

interface TacticDetailProps {
  tactic: TacticResponse;
  user: { role: string; id: number };
  onBack: () => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
  onSelectLineup: (id: number) => void;
}

export default function TacticDetail({ tactic, user, onBack, onDeleted, onUpdated, onSelectLineup }: TacticDetailProps) {
  const [lineups, setLineups] = useState<LineupResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [radarOpen, setRadarOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<MapResponse | null>(null);
  const [maps, setMaps] = useState<MapResponse[]>([]);
  const [form] = Form.useForm();
  const [activePosition, setActivePosition] = useState<number | null>(null);
  const [z, setZ] = useState(0);

  // Select-existing tab state
  const [mapLineups, setMapLineups] = useState<LineupResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [executorMap, setExecutorMap] = useState<Record<number, number | null>>({});
  const [selectLoading, setSelectLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Edit tactic state
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [posPickerOpen, setPosPickerOpen] = useState(false);
  const [editPositions, setEditPositions] = useState<Record<string, PositionData | null> | null>(null);

  const canCreate = user.role === 'admin' || user.role === 'author';
  const canEdit = user.role === 'admin' || tactic.created_by === user.id;
  const canDelete = user.role === 'admin' || tactic.created_by === user.id;
  const mapInfo = maps.find((m) => m.id === tactic.map_id);
  const mapIcon = mapInfo ? MAP_ICONS[mapInfo.name] : null;
  const isMultiLevel = mapInfo ? MULTI_LEVEL_MAPS.has(mapInfo.name) : false;
  const radarUrl = mapInfo ? getRadarUrl(mapInfo.name, z) : '';

  useEffect(() => { listMaps().then(setMaps); }, []);

  const fetchLineups = () => {
    setLoading(true);
    listLineups({ tactic_id: tactic.id })
      .then((res) => setLineups(res.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLineups(); }, [tactic.id]);

  // Pre-load map lineups when modal opens
  useEffect(() => {
    if (modalOpen) {
      const m = maps.find((m) => m.id === tactic.map_id) ?? null;
      setSelectedMap(m);
      form.setFieldsValue({ map_id: tactic.map_id });
      setSelectedIds(new Set());
      setExecutorMap({});
      setFileList([]);
      setSearchKeyword('');
      if (activePosition) {
        form.setFieldsValue({ executor: activePosition });
      }
      listLineups({ map_id: tactic.map_id, page_size: 100 }).then((res) => {
        setMapLineups(res.items.filter((l) => !l.tactics?.some((t) => t.tactic_id === tactic.id)));
      });
    }
  }, [modalOpen]);

  const filteredLineups = activePosition
    ? lineups.filter((l) =>
        l.tactics?.some((t) => t.tactic_id === tactic.id && t.executor === activePosition)
      )
    : [];

  // --- Tab 2: Create new lineup ---
  const handleCreate = async (values: {
    name: string;
    map_id: number;
    utility_type: string;
    side: string;
    description?: string;
    executor?: number;
  }) => {
    setConfirmLoading(true);
    try {
      const posX = form.getFieldValue('pos_x') ?? null;
      const posY = form.getFieldValue('pos_y') ?? null;
      const posZ = form.getFieldValue('pos_z') ?? 0;
      const executor = values.executor ?? null;
      const lineup = await createLineup({
        name: values.name,
        map_id: values.map_id,
        utility_type: values.utility_type,
        side: values.side,
        pos_x: posX,
        pos_y: posY,
        pos_z: posZ,
        description: values.description,
        tactics: [{ tactic_id: tactic.id, executor }],
      });
      for (const f of fileList) {
        if (f.originFileObj) {
          await uploadMedia(lineup.id, f.originFileObj, 'image');
        }
      }
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      setFileList([]);
      setSelectedMap(null);
      fetchLineups();
    } catch {
      message.error('创建失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  // --- Tab 1: Select existing lineups ---
  const handleSelectConfirm = async () => {
    if (selectedIds.size === 0) return;
    setSelectLoading(true);
    try {
      const updates = Array.from(selectedIds).map(async (id) => {
        const existing = mapLineups.find((l) => l.id === id);
        if (!existing) return;
        const newTactics: TacticAssignment[] = [
          ...(existing.tactics ?? []),
          { tactic_id: tactic.id, executor: executorMap[id] ?? null },
        ];
        await updateLineup(id, { tactics: newTactics });
      });
      await Promise.all(updates);
      message.success(`已添加 ${selectedIds.size} 个道具`);
      setModalOpen(false);
      fetchLineups();
    } catch {
      message.error('添加失败');
    } finally {
      setSelectLoading(false);
    }
  };

  const handleRemoveFromTactic = async (lineupId: number) => {
    const lineup = lineups.find((l) => l.id === lineupId);
    if (!lineup?.tactics) return;
    const newTactics = lineup.tactics.filter((t) => t.tactic_id !== tactic.id);
    try {
      await updateLineup(lineupId, { tactics: newTactics.length > 0 ? newTactics : null });
      message.success('已移除');
      fetchLineups();
    } catch {
      message.error('移除失败');
    }
  };

  const handleEditSubmit = async (values: { name: string; category: string; description?: string }) => {
    setEditLoading(true);
    try {
      await updateTactic(tactic.id, { ...values, positions: editPositions });
      message.success('更新成功');
      setEditOpen(false);
      onUpdated?.();
    } catch {
      message.error('更新失败');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setFileList([]);
    setSelectedMap(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 20, flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px',
        background: '#1a1612ee',
        borderBottom: '1px solid #3d3628',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            onClick={onBack}
            style={{ color: '#d4a853', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
          >
            <ArrowLeftOutlined />
            返回
          </span>
          {mapIcon && <img src={mapIcon} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }} />}
          <div>
            <h2 style={{ color: '#f5ead6', margin: 0, fontSize: 16 }}>{tactic.name}</h2>
          </div>
          <span style={{
            color: CATEGORY_COLORS[tactic.category] ?? '#b8956a',
            fontSize: 11,
            background: `${CATEGORY_COLORS[tactic.category] ?? '#b8956a'}20`,
            padding: '1px 6px',
            borderRadius: 4,
            fontWeight: 'bold',
          }}>
            {TACTIC_CATEGORIES.find((c) => c.value === tactic.category)?.label ?? tactic.category}
          </span>
          <span style={{ color: '#8a7560', fontSize: 11 }}>点击数字按钮查看各位置分工</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isMultiLevel && (
            <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
              <Button size="small" type={z === 0 ? 'primary' : 'default'} onClick={() => setZ(0)}>上层</Button>
              <Button size="small" type={z === 1 ? 'primary' : 'default'} onClick={() => setZ(1)}>下层</Button>
            </div>
          )}
          {activePosition && (
            <span style={{ color: POS_COLORS[activePosition - 1], fontSize: 13, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              {activePosition}号位 — {filteredLineups.length} 个道具
            </span>
          )}
          {canEdit && (
            <Button size="small" icon={<EditOutlined />} onClick={() => {
              editForm.setFieldsValue({
                name: tactic.name,
                category: tactic.category,
                description: tactic.description ?? '',
              });
              setEditPositions(tactic.positions ?? null);
              setEditOpen(true);
            }}>
              编辑战术
            </Button>
          )}
          {canCreate && (
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              添加道具
            </Button>
          )}
          {canDelete && (
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: '删除后不可恢复，确定要删除该战术吗？',
                  okText: '删除',
                  okType: 'danger',
                  cancelText: '取消',
                  onOk: async () => {
                    try {
                      await deleteTactic(tactic.id);
                      message.success('已删除');
                      onDeleted?.();
                    } catch {
                      message.error('删除失败');
                    }
                  },
                });
              }}
            >
              删除战术
            </Button>
          )}
        </div>
      </div>

      {/* Radar Map + Description */}
      <div
        onClick={() => setActivePosition(null)}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1612', overflow: 'hidden', position: 'relative' }}
      >
        {tactic.description && (
          <div className="anim-slide-in-left" style={{
            position: 'absolute',
            top: 20,
            left: 20,
            maxWidth: 200,
            zIndex: 15,
            color: '#f5ead6',
            fontSize: 21,
            lineHeight: 1.5,
          }}>
            {tactic.description}
          </div>
        )}
        <div style={{
          position: 'relative',
          width: 'min(100%, calc(100vh - 200px))',
          aspectRatio: '1',
          flexShrink: 0,
        }}>
          <img
            src={radarUrl}
            alt="radar"
            draggable={false}
            loading="lazy"
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          {Object.entries(tactic.positions ?? {}).map(([key, pos]) => {
            if (!pos) return null;
            const num = Number(key);
            if (isMultiLevel && pos.z !== z) return null;
            const isActive = activePosition === num;
            const size = isActive ? 25 : 20;
            return (
              <div
                key={num}
                className={isActive ? 'anim-pulse-glow' : 'anim-scale-in'}
                onClick={(e) => { e.stopPropagation(); setActivePosition(isActive ? null : num); }}
                style={{
                  animationDelay: isActive ? undefined : `${num * 80}ms`,
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: POS_COLORS[num - 1],
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: isActive ? 11 : 9,
                  cursor: 'pointer',
                  boxShadow: `0 0 ${isActive ? 11 : 7}px ${POS_COLORS[num - 1]}${isActive ? 'dd' : '99'}`,
                  border: `2px solid ${isActive ? '#fff' : 'rgba(255,255,255,0.6)'}`,
                  zIndex: 10,
                  transition: 'all 0.2s',
                }}
              >
                {num}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating lineup panel */}
      {activePosition && !loading && (
        <div onClick={(e) => e.stopPropagation()} style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 20,
          background: '#221d18ee',
          borderRadius: 8,
          border: '1px solid #3d3628',
          padding: 12,
          maxHeight: 200,
          overflowY: 'auto',
        }}>
          <div
            onClick={() => setActivePosition(null)}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'rgba(110,118,129,0.4)',
              color: '#f5ead6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 12,
              zIndex: 5,
            }}
          >
            <CloseOutlined />
          </div>
          {tactic.positions?.[String(activePosition)]?.duty && (
            <div style={{
              color: POS_COLORS[activePosition - 1],
              fontSize: 13,
              fontWeight: 'bold',
              marginBottom: filteredLineups.length > 0 ? 8 : 0,
              padding: '4px 8px',
              background: `${POS_COLORS[activePosition - 1]}18`,
              borderRadius: 4,
              border: `1px solid ${POS_COLORS[activePosition - 1]}40`,
            }}>
              {activePosition}号位职责：{tactic.positions[String(activePosition)]?.duty}
            </div>
          )}
          {filteredLineups.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 10,
            }}>
              {filteredLineups.map((lineup) => (
                <div key={lineup.id} style={{ position: 'relative' }}>
                  <LineupCard lineup={lineup} maps={maps} onClick={() => onSelectLineup(lineup.id)} />
                  {canCreate && (
                    <div
                      onClick={(e) => { e.stopPropagation(); handleRemoveFromTactic(lineup.id); }}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'rgba(0,0,0,0.65)',
                        color: '#ff4d4f',
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        lineHeight: '18px',
                        zIndex: 5,
                      }}
                    >
                      移除
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {filteredLineups.length === 0 && !tactic.positions?.[String(activePosition)]?.duty && (
            <div style={{ textAlign: 'center', color: '#b8956a', padding: 8 }}>
              该位置暂无道具点位
            </div>
          )}
        </div>
      )}

      {/* Edit Tactic Modal */}
      <Modal
        title="编辑战术"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={editLoading}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="name" label="战术名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：A区默认烟" />
          </Form.Item>
          <Form.Item name="category" label="战术分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="选择分类">
              {TACTIC_CATEGORIES.map((c) => (
                <Select.Option key={c.value} value={c.value}>{c.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="位置分配">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button
                icon={<AimOutlined />}
                disabled={!mapInfo}
                onClick={() => setPosPickerOpen(true)}
              >
                {editPositions ? '已分配 — 重新选择' : '分配位置'}
              </Button>
              {!mapInfo && <span style={{ color: '#b8956a', fontSize: 12 }}>地图信息不可用</span>}
            </div>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="战术整体说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>
      <PositionPicker
        open={posPickerOpen}
        map={mapInfo ?? null}
        initialPositions={editPositions}
        onConfirm={(pos) => {
          setEditPositions(pos);
          setPosPickerOpen(false);
        }}
        onCancel={() => setPosPickerOpen(false)}
      />

      {/* Add Lineup Modal with Tabs */}
      <Modal
        title="添加道具"
        open={modalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Tabs
          items={[
            {
              key: 'select',
              label: '选择已有道具',
              children: (
                <div>
                  <Input.Search
                    placeholder="搜索道具名称..."
                    allowClear
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={{ marginBottom: 12 }}
                  />
                  <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 12 }}>
                    {mapLineups.filter((l) =>
                      !searchKeyword || l.name.toLowerCase().includes(searchKeyword.toLowerCase())
                    ).length === 0 && (
                      <div style={{ textAlign: 'center', color: '#b8956a', padding: 40 }}>
                        {searchKeyword ? '无匹配道具' : '该地图暂无可用道具'}
                      </div>
                    )}
                    {mapLineups.filter((l) =>
                      !searchKeyword || l.name.toLowerCase().includes(searchKeyword.toLowerCase())
                    ).map((l) => {
                      const checked = selectedIds.has(l.id);
                      const utilityLabel = UTILITY_TYPES.find((u) => u.value === l.utility_type)?.label ?? l.utility_type;
                      return (
                        <div
                          key={l.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '8px 12px',
                            background: checked ? '#1a2e1a' : '#221d18',
                            border: `1px solid ${checked ? '#d4a85340' : '#3d3628'}`,
                            borderRadius: 6,
                            marginBottom: 8,
                          }}
                        >
                          <Checkbox
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) {
                                next.add(l.id);
                                if (activePosition) {
                                  setExecutorMap((prev) => ({ ...prev, [l.id]: activePosition }));
                                }
                              } else {
                                next.delete(l.id);
                                setExecutorMap((prev) => {
                                  const nextMap = { ...prev };
                                  delete nextMap[l.id];
                                  return nextMap;
                                });
                              }
                              setSelectedIds(next);
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#f5ead6', fontSize: 14, fontWeight: 'bold' }}>{l.name}</div>
                            <div style={{ color: '#b8956a', fontSize: 12 }}>
                              {SIDES.find((s) => s.value === l.side)?.label} · {utilityLabel}
                            </div>
                          </div>
                          {checked && (
                            <Select
                              size="small"
                              placeholder="号位"
                              allowClear
                              value={executorMap[l.id] ?? undefined}
                              onChange={(val) => setExecutorMap((prev) => ({ ...prev, [l.id]: val ?? null }))}
                              style={{ width: 80 }}
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Select.Option key={n} value={n}>{n}号位</Select.Option>
                              ))}
                            </Select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button
                      type="primary"
                      loading={selectLoading}
                      disabled={selectedIds.size === 0}
                      onClick={handleSelectConfirm}
                    >
                      添加 ({selectedIds.size})
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              key: 'create',
              label: '新建道具',
              children: (
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]} style={{ marginBottom: 0 }}>
                        <Input placeholder="如：A大烟雾" />
                      </Form.Item>
                      <Form.Item name="map_id" label="地图" style={{ marginBottom: 0 }}>
                        <Select disabled>
                          {maps.map((m) => (
                            <Select.Option key={m.id} value={m.id}>{m.display_name}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <Form.Item name="utility_type" label="道具类型" rules={[{ required: true, message: '请选择' }]} style={{ flex: 1, marginBottom: 0 }}>
                          <Select placeholder="选择类型">
                            {UTILITY_TYPES.map((u) => (
                              <Select.Option key={u.value} value={u.value}>{u.label}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item name="side" label="阵营" rules={[{ required: true, message: '请选择' }]} style={{ flex: 1, marginBottom: 0 }}>
                          <Select placeholder="选择阵营">
                            {SIDES.map((s) => (
                              <Select.Option key={s.value} value={s.value}>{s.label}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                      <Form.Item name="executor" label="执行者" style={{ marginBottom: 0 }}>
                        <Select placeholder="选择号位（可选）" allowClear>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Select.Option key={n} value={n}>{n} 号位</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <Form.Item label="爆点坐标" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Button
                            icon={<AimOutlined />}
                            disabled={!selectedMap}
                            onClick={() => setRadarOpen(true)}
                          >
                            {form.getFieldValue('pos_x') != null
                              ? `(${form.getFieldValue('pos_x')}, ${form.getFieldValue('pos_y')}) — 重新选择`
                              : '选择爆点'}
                          </Button>
                          {!selectedMap && <span style={{ color: '#b8956a', fontSize: 12 }}>请先选择地图</span>}
                        </div>
                        <Form.Item name="pos_x" hidden><Input /></Form.Item>
                        <Form.Item name="pos_y" hidden><Input /></Form.Item>
                        <Form.Item name="pos_z" hidden initialValue={0}><Input /></Form.Item>
                      </Form.Item>
                      <Form.Item name="description" label="描述" style={{ marginBottom: 0 }}>
                        <Input.TextArea rows={3} placeholder="投掷方法描述（可选）" />
                      </Form.Item>
                      <Form.Item label="图片" style={{ marginBottom: 0 }}>
                        <Upload
                          listType="picture-card"
                          fileList={fileList}
                          beforeUpload={() => false}
                          onChange={({ fileList: newList }) => setFileList(newList)}
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                        >
                          {fileList.length < 5 && (
                            <div style={{ color: '#b8956a' }}>
                              <UploadOutlined />
                              <div style={{ fontSize: 12, marginTop: 4 }}>上传图片</div>
                            </div>
                          )}
                        </Upload>
                      </Form.Item>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" htmlType="submit" loading={confirmLoading}>创建并添加</Button>
                  </div>
                </Form>
              ),
            },
          ]}
        />
      </Modal>

      <RadarPicker
        open={radarOpen}
        map={selectedMap}
        onConfirm={(x, y, zVal) => {
          form.setFieldsValue({ pos_x: x, pos_y: y, pos_z: zVal });
          setRadarOpen(false);
        }}
        onCancel={() => setRadarOpen(false)}
      />
    </div>
  );
}
