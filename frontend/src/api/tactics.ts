import client from './client';
import type { TacticResponse, PositionData } from '../types';

export async function getTactic(id: number): Promise<TacticResponse> {
  const res = await client.get<TacticResponse>(`/api/tactics/${id}`);
  return res.data;
}

export async function listTactics(mapId?: number): Promise<TacticResponse[]> {
  const res = await client.get<TacticResponse[]>('/api/tactics', {
    params: mapId ? { map_id: mapId } : undefined,
  });
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
