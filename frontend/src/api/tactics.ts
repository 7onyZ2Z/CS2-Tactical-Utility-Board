import client from './client';
import type { TacticCountsResponse, TacticResponse, TacticListResponse, TacticQueryParams, PositionData } from '../types';

export async function getTacticCounts(mapId?: number): Promise<TacticCountsResponse> {
  const res = await client.get<TacticCountsResponse>('/api/tactics/counts', {
    params: mapId ? { map_id: mapId } : undefined,
  });
  return res.data;
}

export async function getTactic(id: number): Promise<TacticResponse> {
  const res = await client.get<TacticResponse>(`/api/tactics/${id}`);
  return res.data;
}

export async function listTactics(params?: TacticQueryParams): Promise<TacticListResponse> {
  const res = await client.get<TacticListResponse>('/api/tactics', { params });
  return res.data;
}

export async function createTactic(data: {
  name: string;
  category?: string;
  description?: string;
  positions?: Record<string, PositionData | null> | null;
  map_id: number;
}): Promise<TacticResponse> {
  const res = await client.post<TacticResponse>('/api/tactics', data);
  return res.data;
}

export async function updateTactic(id: number, data: {
  name?: string;
  category?: string;
  description?: string;
  positions?: Record<string, PositionData | null> | null;
  map_id?: number;
}): Promise<TacticResponse> {
  const res = await client.put<TacticResponse>(`/api/tactics/${id}`, data);
  return res.data;
}

export async function deleteTactic(id: number): Promise<void> {
  await client.delete(`/api/tactics/${id}`);
}
