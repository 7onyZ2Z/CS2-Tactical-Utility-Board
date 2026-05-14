import client from './client';
import type { LineupListResponse, LineupQueryParams, LineupResponse, TacticAssignment } from '../types';

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
  pos_z?: number;
  description?: string | null;
  tactics?: TacticAssignment[] | null;
}): Promise<LineupResponse> {
  const res = await client.post<LineupResponse>('/api/lineups', data);
  return res.data;
}

export async function updateLineup(id: number, data: {
  name?: string;
  utility_type?: string;
  side?: string;
  pos_x?: number | null;
  pos_y?: number | null;
  pos_z?: number;
  description?: string | null;
  tactics?: TacticAssignment[] | null;
}): Promise<LineupResponse> {
  const res = await client.put<LineupResponse>(`/api/lineups/${id}`, data);
  return res.data;
}

export async function deleteLineup(id: number): Promise<void> {
  await client.delete(`/api/lineups/${id}`);
}

export async function uploadMedia(lineupId: number, file: File, fileType: string = 'image'): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  await client.post(`/api/lineups/${lineupId}/media?file_type=${fileType}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
