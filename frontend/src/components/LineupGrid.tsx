import { Spin } from 'antd';
import type { LineupResponse } from '../types';
import LineupCard from './LineupCard';

interface LineupGridProps {
  lineups: LineupResponse[];
  total: number;
  loading: boolean;
  onSelect: (id: number) => void;
}

export default function LineupGrid({ lineups, total, loading, onSelect }: LineupGridProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ color: '#c9d1d9', fontSize: 14, marginBottom: 16 }}>
        找到 {total} 个点位
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
    </div>
  );
}
