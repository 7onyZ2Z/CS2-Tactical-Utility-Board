import { useState, useEffect } from 'react';
import { Spin, Button, Modal, Form, Input, InputNumber, Select, Upload, message } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import type { LineupResponse, MapResponse } from '../types';
import { createLineup, uploadMedia } from '../api/lineups';
import { listMaps } from '../api/maps';
import { UTILITY_TYPES, SIDES } from './Sidebar';
import LineupCard from './LineupCard';

interface LineupGridProps {
  lineups: LineupResponse[];
  total: number;
  loading: boolean;
  onSelect: (id: number) => void;
  canCreate: boolean;
  onCreated: () => void;
}

export default function LineupGrid({ lineups, total, loading, onSelect, canCreate, onCreated }: LineupGridProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [maps, setMaps] = useState<MapResponse[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (modalOpen) {
      listMaps().then(setMaps);
    }
  }, [modalOpen]);

  const handleSubmit = async (values: {
    name: string;
    map_id: number;
    utility_type: string;
    side: string;
    pos_x?: number;
    pos_y?: number;
    description?: string;
  }) => {
    setConfirmLoading(true);
    try {
      const lineup = await createLineup(values);
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
        <span style={{ color: '#c9d1d9', fontSize: 14 }}>找到 {total} 个点位</span>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新增点位
          </Button>
        )}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 16,
      }}>
        {lineups.map((lineup) => (
          <LineupCard key={lineup.id} lineup={lineup} onClick={() => onSelect(lineup.id)} />
        ))}
      </div>
      {lineups.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8b949e', padding: 80 }}>
          暂无匹配的道具点位
        </div>
      )}

      <Modal
        title="新增道具点位"
        open={modalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        confirmLoading={confirmLoading}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：A大烟雾" />
          </Form.Item>
          <Form.Item name="map_id" label="地图" rules={[{ required: true, message: '请选择地图' }]}>
            <Select placeholder="选择地图">
              {maps.map((m) => (
                <Select.Option key={m.id} value={m.id}>{m.display_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="utility_type" label="道具类型" rules={[{ required: true, message: '请选择' }]} style={{ flex: 1 }}>
              <Select placeholder="选择类型">
                {UTILITY_TYPES.map((u) => (
                  <Select.Option key={u.value} value={u.value}>{u.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="side" label="阵营" rules={[{ required: true, message: '请选择' }]} style={{ flex: 1 }}>
              <Select placeholder="选择阵营">
                {SIDES.map((s) => (
                  <Select.Option key={s.value} value={s.value}>{s.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="pos_x" label="X 坐标" style={{ flex: 1 }}>
              <InputNumber placeholder="可选" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="pos_y" label="Y 坐标" style={{ flex: 1 }}>
              <InputNumber placeholder="可选" style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="投掷方法描述（可选）" />
          </Form.Item>
          <Form.Item label="图片">
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
        </Form>
      </Modal>
    </div>
  );
}
