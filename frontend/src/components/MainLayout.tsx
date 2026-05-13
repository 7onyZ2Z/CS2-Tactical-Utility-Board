import { useState, useEffect, useCallback } from 'react';
import type { UserResponse, LineupResponse } from '../types';
import { listLineups, getLineup } from '../api/lineups';
import Header from './Header';
import Sidebar from './Sidebar';
import LineupGrid from './LineupGrid';
import LineupDetail from './LineupDetail';

interface MainLayoutProps {
  user: UserResponse;
  onLogout: () => void;
}

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
  const [selectedMap, setSelectedMap] = useState<number | null>(null);
  const [selectedUtility, setSelectedUtility] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [lineups, setLineups] = useState<LineupResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedLineupId, setSelectedLineupId] = useState<number | null>(null);
  const [lineupDetail, setLineupDetail] = useState<LineupResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchLineups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLineups({
        map_id: selectedMap ?? undefined,
        utility_type: selectedUtility ?? undefined,
        side: selectedSide ?? undefined,
      });
      setLineups(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [selectedMap, selectedUtility, selectedSide]);

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

  const handleBack = () => {
    setSelectedLineupId(null);
    setLineupDetail(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d1117' }}>
      <Header user={user} onLogout={onLogout} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          selectedMap={selectedMap}
          selectedUtility={selectedUtility}
          selectedSide={selectedSide}
          onMapChange={setSelectedMap}
          onUtilityChange={setSelectedUtility}
          onSideChange={setSelectedSide}
        />
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {selectedLineupId ? (
            <LineupDetail lineup={lineupDetail} loading={detailLoading} onBack={handleBack} />
          ) : (
            <LineupGrid
              lineups={lineups}
              total={total}
              loading={loading}
              onSelect={handleSelectLineup}
              canCreate={user.role === 'admin' || user.role === 'author'}
              onCreated={fetchLineups}
            />
          )}
        </div>
      </div>
    </div>
  );
}
