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

export interface TacticAssignment {
  tactic_id: number;
  executor: number | null;
}

export interface LineupResponse {
  id: number;
  name: string;
  map_id: number;
  utility_type: string;
  side: string;
  pos_x: number | null;
  pos_y: number | null;
  pos_z: number;
  description: string | null;
  tactics: TacticAssignment[] | null;
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

export interface LineupCountsResponse {
  maps: Record<string, number>;
  utilities: Record<string, number>;
  sides: Record<string, number>;
}

export interface LineupQueryParams {
  map_id?: number;
  utility_type?: string;
  side?: string;
  tactic_id?: number;
  keyword?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
}

export interface PositionData {
  x: number;
  y: number;
  z: number;
  duty?: string | null;
}

export interface TacticResponse {
  id: number;
  name: string;
  category: string;
  description?: string | null;
  positions: Record<string, PositionData | null> | null;
  map_id: number;
  created_by: number;
}

export interface TacticListResponse {
  items: TacticResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface TacticQueryParams {
  map_id?: number;
  keyword?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
}
