import { useState, useEffect, useCallback } from 'react';
import type { UserResponse, LineupResponse, TacticResponse } from '../types';
import { listLineups, getLineup, deleteLineup } from '../api/lineups';
import { getTactic } from '../api/tactics';
import { Modal, message } from 'antd';
import Header from './Header';
import Sidebar from './Sidebar';
import LineupGrid from './LineupGrid';
import LineupDetail from './LineupDetail';
import TacticGrid from './TacticGrid';
import TacticDetail from './TacticDetail';

interface MainLayoutProps {
  user: UserResponse;
  onLogout: () => void;
}

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
  const [view, setView] = useState<'lineups' | 'tactics'>('lineups');
  const [selectedMap, setSelectedMap] = useState<number | null>(null);
  const [selectedUtility, setSelectedUtility] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [lineups, setLineups] = useState<LineupResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  const [selectedLineupId, setSelectedLineupId] = useState<number | null>(null);
  const [lineupDetail, setLineupDetail] = useState<LineupResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedTactic, setSelectedTactic] = useState<TacticResponse | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(() => !sessionStorage.getItem('welcome-shown'));

  const fetchLineups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLineups({
        map_id: selectedMap ?? undefined,
        utility_type: selectedUtility ?? undefined,
        side: selectedSide ?? undefined,
        keyword: keyword || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize,
      });
      setLineups(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [selectedMap, selectedUtility, selectedSide, keyword, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [selectedMap, selectedUtility, selectedSide, keyword, sortBy, sortOrder]);

  useEffect(() => {
    fetchLineups();
  }, [fetchLineups]);

  const handleSelectLineup = async (id: number) => {
    setDetailLoading(true);
    setSelectedLineupId(id);
    try {
      const detail = await getLineup(id);
      setLineupDetail(detail);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteLineup(id);
      message.success('已删除');
      setSelectedLineupId(null);
      setLineupDetail(null);
      fetchLineups();
    } catch {
      message.error('删除失败');
    }
  };

  const handleViewChange = (v: 'lineups' | 'tactics') => {
    setView(v);
    setSelectedLineupId(null);
    setLineupDetail(null);
    setSelectedTactic(null);
    setSelectedUtility(null);
    setSelectedSide(null);
  };

  const renderContent = () => {
    if (selectedLineupId) {
      return (
        <LineupDetail
          lineup={lineupDetail}
          loading={detailLoading}
          user={user}
          onBack={() => {
            setSelectedLineupId(null);
            setLineupDetail(null);
          }}
          onDelete={handleDelete}
          onUpdate={() => {
            if (selectedLineupId) handleSelectLineup(selectedLineupId);
          }}
        />
      );
    }

    if (view === 'tactics') {
      if (selectedTactic) {
        return (
          <TacticDetail
            tactic={selectedTactic}
            user={user}
            onBack={() => setSelectedTactic(null)}
            onDeleted={() => setSelectedTactic(null)}
            onUpdated={async () => {
              try {
                const updated = await getTactic(selectedTactic!.id);
                setSelectedTactic(updated);
              } catch { /* ignore */ }
            }}
            onSelectLineup={handleSelectLineup}
          />
        );
      }
      return (
        <TacticGrid
          selectedMap={selectedMap}
          canCreate={user.role === 'admin' || user.role === 'author'}
          onSelect={setSelectedTactic}
        />
      );
    }

    return (
      <LineupGrid
        lineups={lineups}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
        keyword={keyword}
        onKeywordChange={setKeyword}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => { setSortBy(by); setSortOrder(order); }}
        onSelect={handleSelectLineup}
        canCreate={user.role === 'admin' || user.role === 'author'}
        onCreated={fetchLineups}
        onPageChange={(p, ps) => { setPage(p); setPageSize(ps); }}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1612' }}>
      <Header user={user} view={view} onViewChange={handleViewChange} onLogout={onLogout} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          selectedMap={selectedMap}
          selectedUtility={selectedUtility}
          selectedSide={selectedSide}
          view={view}
          onMapChange={setSelectedMap}
          onUtilityChange={setSelectedUtility}
          onSideChange={setSelectedSide}
        />
        <div key={`${view}-${selectedLineupId}-${selectedTactic?.id ?? ''}`} className="anim-fade-in" style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {renderContent()}
        </div>
      </div>

      <Modal
        title="欢迎使用学院CS"
        open={welcomeOpen}
        onCancel={() => { setWelcomeOpen(false); sessionStorage.setItem('welcome-shown', '1'); }}
        footer={null}
        width={520}
      >
        <div style={{ color: '#f5ead6', fontSize: 14, lineHeight: 2 }}>
          <p style={{ marginTop: 0 }}>
            本工具用于 <b style={{ color: '#d4a853' }}>CS2 道具点位</b> 速查与战术管理，适合 5 人小队使用。
          </p>

          <h4 style={{ color: '#d4a853', margin: '16px 0 4px' }}>道具学院</h4>
          <ul style={{ paddingLeft: 20, margin: '4px 0' }}>
            <li>左侧选择 <b>地图 / 道具 / 阵营</b> 筛选点位</li>
            <li>搜索框支持 <b>模糊搜索</b> 道具名称</li>
            <li>切换 <b>创建时间 / 名称</b> 排序，支持升降序</li>
            <li>点击卡片查看详情：图片轮播、雷达图标记、编辑与删除</li>
          </ul>

          <h4 style={{ color: '#d4a853', margin: '16px 0 4px' }}>战术学院</h4>
          <ul style={{ paddingLeft: 20, margin: '4px 0' }}>
            <li>为每张地图创建 <b>战术方案</b>（ECO / 强起 / 长枪）</li>
            <li>雷达图上 <b>拖动位置标记</b> 分配 1-5 号位</li>
            <li>点击位号查看关联道具，支持 <b>添加 / 移除</b></li>
            <li>仅有 <b>创建者和管理员</b> 可编辑或删除战术</li>
          </ul>

          <h4 style={{ color: '#d4a853', margin: '16px 0 4px' }}>账号与权限</h4>
          <ul style={{ paddingLeft: 20, margin: '4px 0' }}>
            <li><b>Admin</b>：可以编辑删除所有内容</li>
            <li><b>Author</b>：可以创建自己的内容和团队账号</li>
            <li><b>Viewer</b>：只能查看，不能修改</li>
          </ul>

          <p style={{ color: '#b8956a', fontSize: 12, margin: '12px 0 0' }}>
            点击顶部标题可在道具学院和战术学院之间切换
          </p>
        </div>
      </Modal>
    </div>
  );
}
