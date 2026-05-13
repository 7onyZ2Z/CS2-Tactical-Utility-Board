import client from './client';
import type { MapResponse } from '../types';

export async function listMaps(): Promise<MapResponse[]> {
  const res = await client.get<MapResponse[]>('/api/maps');
  return res.data;
}
