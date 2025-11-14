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
  id: string;
  name: string;
  logo: string;
  description: string;
  url: string;
  donateUrl: string;
  raised: number;
  campaigns: number;
}

export interface JJUser {
  name: string;
  slug: string;
  avatar: string;
  url: string;
}

export interface JJCampaign {
  id: string;
  causeId: string | null;
  name: string;
  description: string;
  slug: string;
  url: string;
  startTime: string | null;
  raised: number;
  goal: number;
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
  raised: number;
  collections: JJCollections;
  donations: number;
  history: JJHistoryItem[];
  causes: JJCause[];
  campaigns: JJCampaigns;
}
