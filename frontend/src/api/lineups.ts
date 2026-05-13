import client from './client';
import type { LineupListResponse, LineupQueryParams, LineupResponse } from '../types';

export async function listLineups(params?: LineupQueryParams): Promise<LineupListResponse> {
  const res = await client.get<LineupListResponse>('/api/lineups', { params });
  return res.data;
}

export async function getLineup(id: number): Promise<LineupResponse> {
  const res = await client.get<LineupResponse>(`/api/lineups/${id}`);
  return res.data;
}

export async function createLineup(data: {
  name: string;
  map_id: number;
  utility_type: string;
  side: string;
  pos_x?: number | null;
  pos_y?: number | null;
  description?: string | null;
}): Promise<LineupResponse> {
  const res = await client.post<LineupResponse>('/api/lineups', data);
  return res.data;
}
