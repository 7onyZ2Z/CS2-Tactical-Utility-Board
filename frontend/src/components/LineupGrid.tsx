import { useState, useEffect } from 'react';
import { Spin, Button, Modal, Form, Input, Select, Upload, Pagination, Segmented, message } from 'antd';
import { PlusOutlined, UploadOutlined, AimOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import type { LineupResponse, MapResponse } from '../types';
import { createLineup, uploadMedia } from '../api/lineups';
import { listMaps } from '../api/maps';
import { UTILITY_TYPES, SIDES } from './Sidebar';
import LineupCard from './LineupCard';
import RadarPicker from './RadarPicker';

interface LineupGridProps {
  lineups: LineupResponse[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  keyword: string;
  onKeywordChange: (value: string) => void;
  sortBy: string;
  sortOrder: string;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  onSelect: (id: number) => void;
  canCreate: boolean;
  onCreated: () => void;
  onPageChange: (page: number, pageSize: number) => void;
}

export default function LineupGrid({ lineups, total, page, pageSize, loading, keyword, onKeywordChange, sortBy, sortOrder, onSortChange, onSelect, canCreate, onCreated, onPageChange }: LineupGridProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [maps, setMaps] = useState<MapResponse[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [radarOpen, setRadarOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<MapResponse | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    listMaps().then(setMaps);
  }, []);

  const handleSubmit = async (values: {
    name: string;
    map_id: number;
    utility_type: string;
    side: string;
    description?: string;
  }) => {
    setConfirmLoading(true);
    try {
      const posX = form.getFieldValue('pos_x') ?? null;
      const posY = form.getFieldValue('pos_y') ?? null;
      const posZ = form.getFieldValue('pos_z') ?? 0;
      const lineup = await createLineup({ ...values, pos_x: posX, pos_y: posY, pos_z: posZ });
      for (const f of fileList) {
        if (f.originFileObj) {
          await uploadMedia(lineup.id, f.originFileObj, 'image');
        }
      }
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      setFileList([]);
      onCreated();
    } catch {
      message.error('创建失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setFileList([]);
    setSelectedMap(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#c9d1d9', fontSize: 14, whiteSpace: 'nowrap' }}>找到 {total} 个点位</span>
          <Input.Search
            placeholder="搜索道具名称..."
            allowClear
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            style={{ width: 220 }}
            size="small"
          />
          <Segmented
            size="small"
            value={sortBy}
            onChange={(val) => onSortChange(val as string, sortOrder)}
            options={[
              { value: 'created_at', label: '创建时间' },
              { value: 'name', label: '名称' },
            ]}
          />
          <Button
            size="small"
            onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}
          </Button>
        </div>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新增点位
          </Button>
        )}
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {lineups.map((lineup, i) => (
              <div key={lineup.id} className="anim-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                <LineupCard lineup={lineup} maps={maps} onClick={() => onSelect(lineup.id)} />
              </div>
            ))}
          </div>
          {total > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(p) => onPageChange(p, pageSize)}
                size="small"
              />
            </div>
          )}
          {lineups.length === 0 && (
            <div style={{ textAlign: 'center', color: '#8b949e', padding: 80 }}>
              暂无匹配的道具点位
            </div>
          )}
        </>
      )}

      <Modal
        title="新增道具点位"
        open={modalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        confirmLoading={confirmLoading}
        okText="创建"
        cancelText="取消"
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]} style={{ marginBottom: 0 }}>
                <Input placeholder="如：A大烟雾" />
              </Form.Item>
              <Form.Item name="map_id" label="地图" rules={[{ required: true, message: '请选择地图' }]} style={{ marginBottom: 0 }}>
                <Select
                  placeholder="选择地图"
                  onChange={(val: number) => {
                    const m = maps.find((m) => m.id === val) ?? null;
                    setSelectedMap(m);
                    form.setFieldsValue({ pos_x: undefined, pos_y: undefined, pos_z: 0 });
                  }}
                >
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
                  {!selectedMap && <span style={{ color: '#8b949e', fontSize: 12 }}>请先选择地图</span>}
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
                    <div style={{ color: '#8b949e' }}>
                      <UploadOutlined />
                      <div style={{ fontSize: 12, marginTop: 4 }}>上传图片</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </div>
          </div>
        </Form>
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
