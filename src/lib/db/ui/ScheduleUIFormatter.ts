import type {
  Schedule,
  Stream,
  StreamTag,
  DetailedStream
} from "../types/schedule.ts";
import type { User } from "../types/user.ts";
import type {
  ScheduleUI,
  ScheduleDayUI,
  StreamUI,
  ParticipantUI,
  TagUI,
  ScheduleListItemUI,
  StreamListItemUI,
  ScheduleSummaryUI
} from "./types/schedule.ts";

/**
 * Formatter for schedule-related UI data
 */
export class ScheduleUIFormatter {
  /**
   * Formats a schedule for display
   * @param schedule - The schedule to format
   * @param streams - The streams for the schedule
   * @param owner - The owner of the schedule
   * @param canEdit - Whether the current user can edit the schedule
   * @returns The formatted schedule
   */
  formatScheduleForDisplay(
    schedule: Schedule,
    streams: DetailedStream[],
    owner: User,
    canEdit: boolean
  ): ScheduleUI {
    // Group streams by day
    const days = this.groupStreamsByDay(streams);

    return {
      id: schedule.id,
      title: schedule.title,
      slug: schedule.slug,
      year: schedule.year,
      visible: schedule.visible,
      primary: schedule.primary,
      owner: {
        id: owner.id,
        name: owner.role, // Using role as name for simplicity
        avatar: null
      },
      days,
      canEdit,
      createdAt: this.formatDate(schedule.createdAt),
      updatedAt: this.formatDate(schedule.updatedAt)
    };
  }

  /**
   * Formats a schedule for a list
   * @param schedule - The schedule to format
   * @param owner - The owner of the schedule
   * @param streamCount - The number of streams in the schedule
   * @param canEdit - Whether the current user can edit the schedule
   * @returns The formatted schedule list item
   */
  formatScheduleForList(
    schedule: Schedule,
    owner: User,
    streamCount: number,
    canEdit: boolean
  ): ScheduleListItemUI {
    return {
      id: schedule.id,
      title: schedule.title,
      slug: schedule.slug,
      year: schedule.year,
      visible: schedule.visible,
      primary: schedule.primary,
      owner: {
        id: owner.id,
        name: owner.role, // Using role as name for simplicity
        avatar: null
      },
      streamCount,
      canEdit,
      createdAt: this.formatDate(schedule.createdAt),
      updatedAt: this.formatDate(schedule.updatedAt)
    };
  }

  /**
   * Formats a schedule summary
   * @param schedule - The schedule to format
   * @param owner - The owner of the schedule
   * @param streamCount - The number of streams in the schedule
   * @param participantCount - The number of unique participants in the schedule
   * @param nextStream - The next stream in the schedule, if any
   * @returns The formatted schedule summary
   */
  formatScheduleSummary(
    schedule: Schedule,
    owner: User,
    streamCount: number,
    participantCount: number,
    nextStream: Stream | null
  ): ScheduleSummaryUI {
    return {
      id: schedule.id,
      title: schedule.title,
      slug: schedule.slug,
      year: schedule.year,
      visible: schedule.visible,
      primary: schedule.primary,
      owner: {
        id: owner.id,
        name: owner.role, // Using role as name for simplicity
        avatar: null
      },
      streamCount,
      participantCount,
      nextStream: nextStream ? this.formatStreamListItem(nextStream) : null,
      createdAt: this.formatDate(schedule.createdAt),
      updatedAt: this.formatDate(schedule.updatedAt)
    };
  }

  /**
   * Formats a stream for a list
   * @param stream - The stream to format
   * @returns The formatted stream list item
   */
  formatStreamListItem(stream: Stream): StreamListItemUI {
    const start = new Date(stream.start);
    const end = new Date(stream.end);

    return {
      id: stream.id,
      title: stream.title,
      start: this.formatTime(start),
      end: this.formatTime(end),
      duration: this.formatDuration(start, end),
      visible: stream.visible,
      participantCount: 0, // Would need to be provided
      tagCount: 0 // Would need to be provided
    };
  }

  /**
   * Groups streams by day
   * @param streams - The streams to group
   * @returns The streams grouped by day
   */
  private groupStreamsByDay(streams: DetailedStream[]): ScheduleDayUI[] {
    // Group streams by day
    const streamsByDay = streams.reduce((acc, stream) => {
      const date = new Date(stream.start).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(stream);
      return acc;
    }, {} as Record<string, DetailedStream[]>);

    // Sort days and format
    return Object.entries(streamsByDay)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, dayStreams]) => ({
        date,
        formattedDate: this.formatDateForDisplay(date),
        streams: dayStreams.map(stream => this.formatStream(stream))
      }));
  }

  /**
   * Formats a stream for display
   * @param stream - The stream to format
   * @returns The formatted stream
   */
  private formatStream(stream: DetailedStream): StreamUI {
    const start = new Date(stream.start);
    const end = new Date(stream.end);

    return {
      id: stream.id,
      title: stream.title,
      subtitle: stream.subtitle,
      description: stream.description,
      start: this.formatTime(start),
      end: this.formatTime(end),
      duration: this.formatDuration(start, end),
      visible: stream.visible,
      youtubeVodUrl: stream.youtubeVodUrl,
      twitchVodUrl: stream.twitchVodUrl,
      participants: stream.participants?.map(p => this.formatParticipant(p)) || [],
      tags: stream.tags?.map(t => this.formatTag(t)) || []
    };
  }

  /**
   * Formats a participant for display
   * @param participant - The participant to format
   * @returns The formatted participant
   */
  private formatParticipant(participant: User): ParticipantUI {
    return {
      id: participant.id,
      name: participant.role, // Using role as name for simplicity
      avatar: null,
      twitchUsername: null // Would need to be extracted from accounts
    };
  }

  /**
   * Formats a tag for display
   * @param tag - The tag to format
   * @returns The formatted tag
   */
  private formatTag(tag: StreamTag): TagUI {
    return {
      tag: tag.tag,
      label: tag.label,
      color: this.getTagColor(tag.tag)
    };
  }

  /**
   * Formats a date for display
   * @param dateString - The date string to format
   * @returns The formatted date
   */
  private formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formats a date
   * @param date - The date to format
   * @returns The formatted date
   */
  private formatDate(date: Date | string | number): string {
    const dateObj = new Date(date);
    return dateObj.toISOString();
  }

  /**
   * Formats a time
   * @param date - The date to format
   * @returns The formatted time
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Formats a duration
   * @param start - The start date
   * @param end - The end date
   * @returns The formatted duration
   */
  private formatDuration(start: Date, end: Date): string {
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
      return `${minutes}m`;
    }

    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  }

  /**
   * Gets a color for a tag
   * @param tag - The tag
   * @returns The color for the tag
   */
  private getTagColor(tag: string): string {
    // Map tags to colors or use a hash function
    const tagColors: Record<string, string> = {
      'charity': '#e30e50',
      'gaming': '#3584bf',
      'interview': '#f67932',
      'music': '#8a2be2',
      // Add more tag colors as needed
    };

    return tagColors[tag] || '#6b7280'; // Default gray color
  }
}
