/* eslint-disable camelcase */
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email: string;
  created_at: string;
}

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

export interface StreamData {
  stream: TwitchStream,
  createdAt: string,
  updatedAt: string,
  endedAt?: string,
}

/* eslint-enable camelcase */
export interface UserResult {
  data: TwitchUser[];
}
/* eslint-enable camelcase */
export interface StreamResult {
  data: TwitchStream[];
}

export type TwitchAPIResult<T> = {
  data: T
  error: null,
} | {
  data: null,
  error: {
    status: number,
    description: string,
  }
}

export interface TokenData {
  access_token: string;
  expires_in: number,
  token_type: string
}
