/**
 * UI representation of a schedule
 */
export interface ScheduleUI {
  id: number;
  title: string;
  slug: string;
  year: number;
  visible: boolean;
  primary: boolean;
  owner: {
    id: number;
    name: string;
    avatar: string | null;
  };
  days: ScheduleDayUI[];
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * UI representation of a schedule day
 */
export interface ScheduleDayUI {
  date: string;
  formattedDate: string;
  streams: StreamUI[];
}

/**
 * UI representation of a stream
 */
export interface StreamUI {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  start: string;
  end: string;
  duration: string;
  visible: boolean;
  youtubeVodUrl: string | null;
  twitchVodUrl: string | null;
  participants: ParticipantUI[];
  tags: TagUI[];
}

/**
 * UI representation of a stream participant
 */
export interface ParticipantUI {
  id: number;
  name: string;
  avatar: string | null;
  twitchUsername: string | null;
}

/**
 * UI representation of a stream tag
 */
export interface TagUI {
  tag: string;
  label: string;
  color: string;
}

/**
 * UI representation of a schedule list item
 */
export interface ScheduleListItemUI {
  id: number;
  title: string;
  slug: string;
  year: number;
  visible: boolean;
  primary: boolean;
  owner: {
    id: number;
    name: string;
    avatar: string | null;
  };
  streamCount: number;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * UI representation of a stream list item
 */
export interface StreamListItemUI {
  id: number;
  title: string;
  start: string;
  end: string;
  duration: string;
  visible: boolean;
  participantCount: number;
  tagCount: number;
}

/**
 * UI representation of a schedule summary
 */
export interface ScheduleSummaryUI {
  id: number;
  title: string;
  slug: string;
  year: number;
  visible: boolean;
  primary: boolean;
  owner: {
    id: number;
    name: string;
    avatar: string | null;
  };
  streamCount: number;
  participantCount: number;
  nextStream: StreamListItemUI | null;
  createdAt: string;
  updatedAt: string;
}
