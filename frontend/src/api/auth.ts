import client from './client';
import type { LoginRequest, TokenResponse, UserResponse } from '../types';

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/api/auth/login', data);
  return res.data;
}

export async function logout(): Promise<void> {
  await client.post('/api/auth/logout');
}

export async function getMe(): Promise<UserResponse> {
  const res = await client.get<UserResponse>('/api/auth/me');
  return res.data;
}
