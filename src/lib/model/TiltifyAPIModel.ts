/* eslint-disable camelcase */
export interface TiltifyImage {
  alt: string;
  height: number;
  src: string;
  width: number;
}

export interface TiltifySocial {
  discord?: string;
  facebook?: string;
  instagram?: string;
  snapchat?: string;
  tiktok?: string;
  twitch?: string;
  twitter?: string;
  website?: string;
  youtube?: string;
}

export interface TiltifyMonetaryValue {
  currency: string;
  value: string;
}

export interface TiltifyUserData {
  avatar: TiltifyImage;
  description: string;
  id: string;
  legacy_id: number;
  slug: string;
  social: TiltifySocial;
  total_amount_raised: TiltifyMonetaryValue;
  url: string;
  username: string;
}

export interface TiltifyUserResponse {
  data: TiltifyUserData;
}

export interface TiltifyCampaignAvatar {
  alt: string;
  height: number;
  src: string;
  width: number;
}

export interface TiltifyCampaignSocial {
  discord?: string;
  facebook?: string;
  instagram?: string;
  snapchat?: string;
  tiktok?: string;
  twitch?: string;
  twitter?: string;
  website?: string;
  youtube?: string;
}

export interface TiltifyCampaignTotalAmountRaised {
  currency: string;
  value: string;
}

export interface TiltifyCampaignData {
  avatar: TiltifyCampaignAvatar;
  description: string;
  id: string;
  legacy_id: number;
  name: string;
  slug: string;
  social: TiltifyCampaignSocial;
  total_amount_raised: TiltifyCampaignTotalAmountRaised;
  url: string;
}

export interface TiltifyCampaignMetadata {
  after: string | null;
  before: string | null;
  limit: number;
}

export interface TiltifyUserCampaigns {
  data: TiltifyCampaignData[];
  metadata: TiltifyCampaignMetadata;
}

export interface TiltifyErrorFields {
  [key: string]: string[];
}

export interface TiltifyError {
  fields: TiltifyErrorFields | null;
  message: string;
  status: number;
}

export interface TiltifyErrorResponse {
  error: TiltifyError;
}

export type TiltifyUserCampaignsResponse = {
  data: TiltifyUserCampaigns
  error: null
} | {
  data: null,
  error: TiltifyError
}

export type AllCampaignsResponse = {
  data: (TiltifyUserCampaigns)[];
  error: null
} | {
  data: null;
  error: TiltifyError
}

export type TiltifyAPIResult<T> = {
  data: T
  error: null,
} | {
  data: null,
  error: TiltifyError
}

export interface TiltifyToken {
  accessToken: string;
  createdAt: string;
  expiresIn: number;
  refreshToken: string;
  scope: string;
  tokenType: string;
}
/* eslint-enable camelcase */
