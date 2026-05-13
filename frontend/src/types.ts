export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

export interface MapResponse {
  id: number;
  name: string;
  display_name: string;
  image_url: string | null;
}

export interface MediaResponse {
  id: number;
  lineup_id: number;
  file_type: string;
  file_path: string;
  sort_order: number;
}

export interface LineupResponse {
  id: number;
  name: string;
  map_id: number;
  utility_type: string;
  side: string;
  pos_x: number | null;
  pos_y: number | null;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  media: MediaResponse[];
}

export interface LineupListResponse {
  items: LineupResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface LineupQueryParams {
  map_id?: number;
  utility_type?: string;
  side?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}
