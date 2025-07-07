import type {TagUI} from "./TagUI.ts";
import type {ScheduleUI} from "./schedule-ui.ts";
import type {InferSelectModel} from "drizzle-orm";
import {twitchChannelSchema} from "../schema/twitch-channel-schema.ts";


export type UserItemUI = {
  id: number;
  name: string;
  slug: string;
  style: UserStyle;
  liveState: UserLiveState
  tags: TagUI[];
  socials: UserSocial[]
}

/**
 * The data model for a user's page
 */
export type UserPageUI = {
  id: number;
  name: string;
  slug: string;
  style: UserStyle;
  liveState: UserLiveState
  tags: TagUI[];
  socials: UserSocial[]
  teams: UserTeam[]
  schedule: ScheduleUI | null;
}

export type UserLiveState = {
  id: number; // id, users table
  name: string; // username, account table, tiltify
  slug: string; // user slug, account table, tiltify
  isLive: boolean; // has a twitch stream in twitchStreamSchema table
  primaryLiveStream: string
  channel: {
    twitch?: InferSelectModel<typeof twitchChannelSchema>
    // TODO youtube
  }
}

export type UserProfileImages = {
  default: string;
  mobile: string;
}

export type UserStyle = {
  primaryColor: string;
  accentColor: string;
  profileImage: UserProfileImages
}

export type UserSocial = {
  provider: string;
  label?: string;
  url: string;
}

export type UserSocials = {
  socials: UserSocial[];
}

export type UserTeam = {id: number, name: string, description: string | null, slug: string}
