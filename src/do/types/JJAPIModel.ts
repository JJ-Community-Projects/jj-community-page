// TypeScript types for JingleJam data
export interface JJEvent {
  year: number;
  start: string;
  end: string;
}

export interface JJRaised {
  yogscast: number;
  fundraisers: number;
}

export interface JJCollections {
  redeemed: number;
  total: number;
}

export interface JJDonations {
  count: number;
}

export interface JJHistoryTotal {
  dollars: number;
  pounds: number;
}

export interface JJHistoryItem {
  year: number;
  total: JJHistoryTotal;
  donations: number;
}

export interface JJCause {
  id: number;
  name: string;
  logo: string;
  description: string;
  url: string;
  donateUrl: string;
  raised: JJRaised;
}

export interface JJLivestream {
  channel: string | null;
  type: string;
}

export interface JJUser {
  id: number;
  name: string;
  slug: string;
  avatar: string;
  url: string;
}

export interface JJCampaign {
  causeId: number;
  name: string;
  description: string;
  slug: string;
  url: string;
  startTime: string;
  raised: number;
  goal: number;
  livestream: JJLivestream;
  user: JJUser;
}

export interface JJCampaigns {
  count: number;
  list: JJCampaign[];
}

export interface JingleJamResponse {
  date: string;
  event: JJEvent;
  avgConversionRate: number;
  raised: JJRaised;
  collections: JJCollections;
  donations: JJDonations;
  history: JJHistoryItem[];
  causes: JJCause[];
  campaigns: JJCampaigns;
}

export interface JJData {
  date: string;
  event: JJEvent;
  avgConversionRate: number;
  raised: JJRaised;
  collections: JJCollections;
  donations: JJDonations;
}
