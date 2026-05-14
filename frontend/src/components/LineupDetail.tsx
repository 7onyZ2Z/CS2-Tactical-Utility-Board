import { useState, useRef, useEffect } from 'react';
import { Spin, Tag, Carousel, Button, Modal, Form, Input, Select, message, Image } from 'antd';
import type { CarouselRef } from 'antd/es/carousel';
import { ArrowLeftOutlined, LeftOutlined, RightOutlined, DeleteOutlined, EditOutlined, AimOutlined } from '@ant-design/icons';
import type { LineupResponse, UserResponse, MapResponse } from '../types';
import { updateLineup } from '../api/lineups';
import { listMaps } from '../api/maps';
import { UTILITY_TYPES, SIDES } from './Sidebar';
import RadarPicker from './RadarPicker';

const MULTI_LEVEL_MAPS = new Set(['nuke', 'vertigo', 'train']);

function getRadarUrl(mapName: string, z: number): string {
  if (MULTI_LEVEL_MAPS.has(mapName)) {
    return z === 0 ? `/radar/de_${mapName}_upper.png` : `/radar/de_${mapName}_lower.png`;
  }
  return `/radar/de_${mapName}.png`;
}

const UTILITY_ICONS: Record<string, string> = {
  smoke: '/utility_icon2/Smoke.png',
  flash: '/utility_icon2/Flashbang.png',
  molotov: '/utility_icon2/Molly.png',
  he: '/utility_icon2/Hegrenade.png',
};

interface LineupDetailProps {
  lineup: LineupResponse | null;
  loading: boolean;
  user: UserResponse;
  onBack: () => void;
  onDelete: (id: number) => void;
  onUpdate?: () => void;
}

const arrowBtn: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.45)',
  border: 'none',
  color: '#fff',
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 2,
  transition: 'background 0.2s',
};

export default function LineupDetail({ lineup, loading, user, onBack, onDelete, onUpdate }: LineupDetailProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const carouselRef = useRef<CarouselRef>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [maps, setMaps] = useState<MapResponse[]>([]);
  const [radarOpen, setRadarOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<MapResponse | null>(null);
  const [editForm] = Form.useForm();

  const canEdit = lineup && (user.role === 'admin' || lineup.created_by === user.id);

  useEffect(() => {
    setImgIndex(0);
    carouselRef.current?.goTo(0, true);
  }, [lineup?.id]);

  useEffect(() => {
    listMaps().then(setMaps);
  }, []);

  useEffect(() => {
    if (editOpen && lineup) {
      const m = maps.find((m) => m.id === lineup.map_id) ?? null;
      setSelectedMap(m);
      editForm.setFieldsValue({
        name: lineup.name,
        utility_type: lineup.utility_type,
        side: lineup.side,
        description: lineup.description ?? '',
        pos_x: lineup.pos_x,
        pos_y: lineup.pos_y,
        pos_z: lineup.pos_z,
      });
    }
  }, [editOpen, lineup, maps]);

  const handleEdit = async (values: {
    name: string;
    utility_type: string;
    side: string;
    description?: string;
  }) => {
    if (!lineup) return;
    setEditLoading(true);
    try {
      const posX = editForm.getFieldValue('pos_x') ?? null;
      const posY = editForm.getFieldValue('pos_y') ?? null;
      const posZ = editForm.getFieldValue('pos_z') ?? 0;
      await updateLineup(lineup.id, {
        ...values,
        pos_x: posX,
        pos_y: posY,
        pos_z: posZ,
      });
      message.success('更新成功');
      setEditOpen(false);
      onUpdate?.();
    } catch {
      message.error('更新失败');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading || !lineup) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const utilityLabel = UTILITY_TYPES.find((u) => u.value === lineup.utility_type)?.label ?? lineup.utility_type;
  const sideLabel = SIDES.find((s) => s.value === lineup.side)?.label ?? lineup.side;
  const utilityIcon = UTILITY_ICONS[lineup.utility_type];
  const mapInfo = maps.find((m) => m.id === lineup.map_id);
  const radarUrl = mapInfo ? getRadarUrl(mapInfo.name, lineup.pos_z) : '';
  const images = lineup.media.filter((m) => m.file_type === 'image');
  const video = lineup.media.find((m) => m.file_type === 'video');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div
          onClick={onBack}
          style={{
            color: '#4ade80',
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ArrowLeftOutlined />
          返回列表
        </div>
        {canEdit && (
          <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
            编辑点位
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#e0e0e0', margin: 0 }}>{lineup.name}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag color="green">{sideLabel}</Tag>
          <Tag>{utilityLabel}</Tag>
        </div>
      </div>

      {lineup.description && (
        <div className="anim-slide-in-left" style={{
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

      <div style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
      }}>
        {images.length > 0 && (
          <div style={{ position: 'relative', aspectRatio: '16/9' }}>
            <style>{'.carousel-img .ant-image-img { object-fit: contain !important; }'}</style>
            <Carousel
              key={lineup.id}
              ref={carouselRef}
              autoplay={false}
              dots={false}
              afterChange={setImgIndex}
            >
              {images.map((m) => (
                <div key={m.id}>
                  <div style={{
                    aspectRatio: '16/9',
                    background: '#21262d',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Image
                      src={`/${m.file_path}`}
                      preview={{ mask: '点击查看原图' }}
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                      rootClassName="carousel-img"
                    />
                  </div>
                </div>
              ))}
            </Carousel>
            {images.length > 1 && (
              <>
                <button
                  style={{ ...arrowBtn, left: 8 }}
                  onClick={() => carouselRef.current?.prev()}
                >
                  <LeftOutlined />
                </button>
                <button
                  style={{ ...arrowBtn, right: 8 }}
                  onClick={() => carouselRef.current?.next()}
                >
                  <RightOutlined />
                </button>
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 6,
                  zIndex: 2,
                }}>
                  {images.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => carouselRef.current?.goTo(i)}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: i === imgIndex ? '#4ade80' : 'rgba(255,255,255,0.4)',
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {video && (
          <video
            src={`/${video.file_path}`}
            controls
            style={{ width: '100%', display: 'block' }}
          />
        )}

        {images.length === 0 && !video && (
          <div style={{ padding: 40, textAlign: 'center', color: '#8b949e' }}>
            暂无媒体文件
          </div>
        )}
      </div>

      {/* Radar map with position marker */}
      {lineup.pos_x != null && lineup.pos_y != null && mapInfo && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <div style={{
            position: 'relative',
            aspectRatio: '1',
            height: 'min(600px, calc(100vh - 300px))',
            background: '#161b22',
            border: '1px solid #21262d',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <img
              src={radarUrl}
              alt="radar"
              draggable={false}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
            {utilityIcon && (
              <img
                src={utilityIcon}
                alt={utilityLabel}
                style={{
                  position: 'absolute',
                  left: `${lineup.pos_x}%`,
                  top: `${lineup.pos_y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 28,
                  height: 28,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))',
                  zIndex: 10,
                }}
              />
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {lineup.pos_x != null && lineup.pos_y != null && (
            <span style={{ color: '#8b949e', fontSize: 12, background: '#21262d', padding: '4px 8px', borderRadius: 4 }}>
              坐标: ({lineup.pos_x}, {lineup.pos_y})
            </span>
          )}
        </div>
        {user.role === 'admin' || lineup.created_by === user.id ? (
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '删除后不可恢复，确定要删除该点位吗？',
                okText: '删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: () => onDelete(lineup.id),
              });
            }}
          >
            删除点位
          </Button>
        ) : (
          <Button
            disabled
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.info({
                title: '无权限',
                content: '该道具非你创建，没有权限删除',
                okText: '知道了',
              });
            }}
          >
            删除点位
          </Button>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        title="编辑点位"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={editLoading}
        okText="保存"
        cancelText="取消"
        width={800}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]} style={{ marginBottom: 0 }}>
                <Input placeholder="如：A大烟雾" />
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
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Form.Item label="爆点坐标" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button
                    icon={<AimOutlined />}
                    disabled={!selectedMap}
                    onClick={() => setRadarOpen(true)}
                  >
                    {editForm.getFieldValue('pos_x') != null
                      ? `(${editForm.getFieldValue('pos_x')}, ${editForm.getFieldValue('pos_y')}) — 重新选择`
                      : '选择爆点'}
                  </Button>
                  {!selectedMap && <span style={{ color: '#8b949e', fontSize: 12 }}>请先选择地图</span>}
                </div>
                <Form.Item name="pos_x" hidden><Input /></Form.Item>
                <Form.Item name="pos_y" hidden><Input /></Form.Item>
                <Form.Item name="pos_z" hidden initialValue={0}><Input /></Form.Item>
              </Form.Item>
              <Form.Item name="description" label="描述" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={3} placeholder="投掷方法描述（可选）" />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>

      <RadarPicker
        open={radarOpen}
        map={selectedMap}
        onConfirm={(x, y, zVal) => {
          editForm.setFieldsValue({ pos_x: x, pos_y: y, pos_z: zVal });
          setRadarOpen(false);
        }}
        onCancel={() => setRadarOpen(false)}
      />

    </div>
  );
}
