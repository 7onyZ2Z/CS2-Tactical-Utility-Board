import { useState, useEffect, useCallback } from 'react';
import type { UserResponse, LineupResponse, TacticResponse } from '../types';
import { listLineups, getLineup, deleteLineup } from '../api/lineups';
import { getTactic } from '../api/tactics';
import { message } from 'antd';
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
    </div>
  );
}
