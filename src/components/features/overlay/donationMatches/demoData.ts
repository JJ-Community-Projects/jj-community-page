import type { DonationMatchItem } from '../../../../lib/orpc/private/overlay/contract.ts'

// Static fixtures for the editor preview (?demo=1). Never rendered on a live
// OBS URL unless the param is appended explicitly.
//
// Campaign names/channels mirror the real Tiltify campaigns for these Twitch
// channels so the preview matches what the overlay shows once they have an
// active donation match.
export const DEMO_MATCHES: DonationMatchItem[] = [
  {
    campaignName: "Kip & Ivy's Jingle Jam 2025!",
    channelUrl: 'https://twitch.tv/mudkipninja',
    twitchName: 'Mudkipninja',
    startsAt: new Date('2025-12-05T19:00:00.000Z'),
    avatar:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/3432b4ae-f48c-4e95-a4f3-b697f6e50a18-profile_image-300x300.png',
  },
  {
    campaignName: 'Mousie & Friends for War Child',
    channelUrl: 'https://twitch.tv/mousie',
    twitchName: 'Mousie',
    startsAt: new Date('2025-12-04T17:30:00.000Z'),
    avatar:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/2c3ead1b-d850-4d1d-a274-dcadbaabe17f-profile_image-300x300.png',
  },
  {
    campaignName: 'BLEBJAM - CALM x War Child - Jingle Jam 2025',
    channelUrl: 'https://twitch.tv/hrry',
    twitchName: 'Hrry',
    startsAt: new Date('2025-12-03T20:00:00.000Z'),
    avatar:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/b96b5bdb-7ae0-420e-b8ed-2410b14ed01e-profile_image-300x300.png',
  },
  {
    campaignName: 'Screaming Against Suicide 2025',
    channelUrl: 'https://twitch.tv/chasedbyvoices',
    twitchName: 'ChasedByVoices',
    startsAt: new Date('2025-12-02T15:00:00.000Z'),
    avatar:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/0f4182b8-fe18-4fa8-ba2e-1e513573a10b-profile_image-300x300.png',
  },
  {
    campaignName: 'Boba & Friends for Autistica',
    channelUrl: 'https://twitch.tv/boba',
    twitchName: 'Boba',
    startsAt: new Date('2025-12-01T13:00:00.000Z'),
    avatar:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/e29551ad-15ef-4461-b709-220a8d374d3d-profile_image-300x300.png',
  },
]
