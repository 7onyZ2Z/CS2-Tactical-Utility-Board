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
