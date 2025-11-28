import type { UserDisplay, UserStream } from './contract.ts'
import { getEntry } from 'astro:content'
import { getYogsScheduleFromContent } from '../../../../content/getYogsScheduleFromContent.ts'
import type { YogsCreator } from '../yogs/contract.ts'

export async function getHardCodedEvents(): Promise<UserStream[]> {
  const currentDate = new Date()
  // const yogs =await getHardCodedEventsJustYogs()
  const noYogs = await getHardCodedEventsNoYogs()

  const allEvents = [...noYogs]

  const upcomingEvents = allEvents.filter(
    (event) => event.stream.start >= currentDate,
  )

  upcomingEvents.sort(
    (a, b) => a.stream.start.getTime() - b.stream.start.getTime(),
  )

  return upcomingEvents.slice(0, 4)
}

export async function getHardCodedEventsNoYogs(): Promise<UserStream[]> {
  const week1: UserStream[] = [
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 102,
        title: 'SIMON CLARK',
        visible: true,
        subtitle: null,
        description:
          "Check out Dr. Simon Clark's video talking about WWF's latest global tipping points report and his recent trip to WWF's Living Planet Centre.",
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-01T19:00:00.000Z'),
        end: new Date('2025-12-01T21:00:00.000Z'),
        isTimeTBD: false,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'youtube',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'Dr Simon Clark',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/f5bca7c3-5f81-4e68-af34-097e2ada306d-profile_image-70x70.png',
        twitchLogin: null,
        youtubeUrl: 'https://www.youtube.com/@SimonClark',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 103,
        title: 'CHRIS MD',
        visible: true,
        subtitle: 'Stone-cold gaming classics',
        description:
          'ChrisMD and mates get together for a session of stone-cold gaming classics.',
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-02T20:00:00.000Z'),
        end: new Date('2025-12-02T22:00:00.000Z'),
        isTimeTBD: true,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'youtube',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'CHRIS MD',
        profileImage:
          'https://yt3.googleusercontent.com/NR9Jl-pSRc9Hzrf91VMm2WKrcoHC1fIgyttQh_2H2HI09Imr-5nEep-JiwcizZB_CrGbTq8lIA=s160-c-k-c0x00ffffff-no-rj',
        twitchLogin: null,
        youtubeUrl: 'https://www.youtube.com/@chrismdixon10',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 104,
        title: 'JACK MANIFOLD',
        visible: true,
        subtitle: '24 hours of non-stop action',
        description:
          'Tune in for a full 24 hours of non-stop action with the master of the long stream. Expect everything from chaotic IRL segments and party games to loads more.',
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-02T18:00:00.000Z'),
        end: new Date('2025-12-03T18:00:00.000Z'),
        isTimeTBD: true,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'twitch',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'JackManifoldTV',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/f7bfa0ca-e9ec-4ca6-935a-a9b6c5c8f651-profile_image-70x70.png',
        twitchLogin: 'jackmanifoldtv',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 105,
        title: 'JEN AND ALIONA',
        visible: true,
        subtitle: 'Clair Obscur: Expedition 33',
        description:
          'Join Clair Obscur: Expedition 33 stars Jennifer English and Aliona Baranova as they carve a path to the Monolith to fight the Paintress!',
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-02T19:00:00.000Z'),
        end: new Date('2025-12-02T22:00:00.000Z'),
        isTimeTBD: true,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'twitch',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'JenandAliona',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/46d24a55-a2a1-47b9-89c8-8446e69657fc-profile_image-70x70.png',
        twitchLogin: 'jenandaliona',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 107,
        title: 'LITTLEBUNNY_X',
        visible: true,
        subtitle: 'Wild games and cooking streams',
        description:
          'Support Bunny as she takes on a variety of wild games on 2nd December and check back in throughout the two weeks for cooking streams and special guests!',
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-02T11:00:00.000Z'),
        end: new Date('2025-12-02T13:00:00.000Z'),
        isTimeTBD: false,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'twitch',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'littlebunny_x',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/de635b64-2eaf-4a2e-8704-02c74d0c1ea4-profile_image-70x70.png',
        twitchLogin: 'littlebunny_x',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 108,
        title: 'NAKED & AFRAID',
        visible: true,
        subtitle: 'Minecraft Survival Challenge',
        description:
          '21 seasoned Minecraft pros take on the hardest survival challenge on the internet, with one life and no hope.',
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-02T14:00:00.000Z'),
        end: new Date('2025-12-02T16:00:00.000Z'),
        isTimeTBD: false,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'twitch',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'shubble',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/a2c21c36-d5fa-4c47-a1ef-ea0e4eb6cfbe-profile_image-70x70.png',
        twitchLogin: 'shubble',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 109,
        title: 'ZEALAND',
        visible: true,
        subtitle: "Football Manager '26 'Charity-O-Thon'",
        description:
          "Join Zealand as he takes on his Football Manager '26 'Charity-O-Thon' save trying to win the championship with a team linked to War Child. But what team will he choose?",
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-07T16:00:00.000Z'),
        end: new Date('2025-12-07T18:00:00.000Z'),
        isTimeTBD: false,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'twitch',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'Zealand',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/97eab8e6-7c73-4c57-8982-03af8a0d83df-profile_image-70x70.png',
        twitchLogin: 'zeaiand',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 110,
        title: "WAR CHILD'S QUIZ OF THE YEAR",
        visible: true,
        subtitle: null,
        description:
          "War Child's Quiz of the Year returns! Join the stream and play-along with their creator contestants as they battle it out to be named quiz champion.",
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-03T20:00:00.000Z'),
        end: new Date('2025-12-03T22:00:00.000Z'),
        isTimeTBD: true,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'twitch',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'WarChildUKGaming',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/f80cf57e-714f-438f-8041-6cfbb3381fc3-profile_image-70x70.jpg',
        twitchLogin: 'warchildukgaming',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 111,
        title: 'ARTHURTV',
        visible: true,
        subtitle: 'Planet Zoo and guests',
        description:
          'Join Arthur for a evening of wildlife fun including Planet Zoo and maybe even some special guests!',
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-03T18:00:00.000Z'),
        end: new Date('2025-12-03T20:00:00.000Z'),
        isTimeTBD: false,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'twitch',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'arthurtv',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/dc49b1e8-16f3-400c-b57c-bd5546e5f79e-profile_image-70x70.png',
        twitchLogin: 'arthurtv',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 112,
        title: 'SMOSH GAMES KARAOKE',
        visible: true,
        subtitle: null,
        description:
          "The Smosh Games crew is back for another year of Jingle Jam karaoke, and we couldn't be more thrilled! Tune in to their channel, enjoy some fabulous tunes, and support their Trevor Project fundraiser!",
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-03T23:00:00.000Z'),
        end: new Date('2025-12-04T01:00:00.000Z'),
        isTimeTBD: false,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'youtube',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'Smosh',
        profileImage:
          'https://yt3.googleusercontent.com/ytc/AIdro_noAvfLiftnnGZwsTFt6GD4UKSxhNJRIUWntPUL47rziiXo=s160-c-k-c0x00ffffff-no-rj',
        twitchLogin: null,
        youtubeUrl: 'https://www.youtube.com/@smoshgames',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 113,
        title: 'TALIA MAR',
        visible: true,
        subtitle: '12-hour streaming marathon',
        description:
          "Back for her second Jingle Jam, join Talia for a 12-hour streaming marathon! She's bringing nonstop music, hilarious games, and a full day of charity goodness.",
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-04T10:00:00.000Z'),
        end: new Date('2025-12-04T22:00:00.000Z'),
        isTimeTBD: false,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'twitch',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'taliamar',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/05a2f862-6ea4-4e31-901f-0ff846d173eb-profile_image-70x70.png',
        twitchLogin: 'TaliaMar',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 114,
        title: 'JUST ANOTHER MINECRAFT SERVER (JAMS)',
        visible: true,
        subtitle: 'Chaotic 100 creator Minecraft SMP',
        description:
          'Chaotic 100 creator Minecraft SMP featuring a race to complete a series of 9 collaborative quests whilst also avoiding the mayhem caused by the various donation incentives.',
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-05T21:00:00.000Z'),
        end: new Date('2025-12-05T23:00:00.000Z'),
        isTimeTBD: false,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'twitch',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'Wadebox',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/7046c4e5-a788-4e3e-bd73-03e285caa9f7-profile_image-70x70.png',
        twitchLogin: 'wadebox',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 115,
        title: 'JUST CREATE SMP WEEKENDER',
        visible: true,
        subtitle: 'Full weekend of fun',
        description:
          "Clear your calendar for a full weekend of Just Create SMP fun! You'll get silly games, plenty of (mostly) friendly competition, and, of course, a bit of Minecraft.",
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-06T20:00:00.000Z'),
        end: new Date('2025-12-08T20:00:00.000Z'),
        isTimeTBD: true,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'twitch',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'MrBeardstone',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/a7e0d921-78cb-4496-9f2f-c16e2df6204d-profile_image-70x70.png',
        twitchLogin: 'mrbeardstone',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
    {
      stream: {
        id: -1,
        scheduleId: 1,
        createdBy: 116,
        title: 'HIGH ROLLERS DND',
        visible: true,
        subtitle: 'Unforgettable DnD one-shot',
        description:
          "The High Rollers crew return for another unforgettable DnD one-shot. Prepare for chaos - where they end up is anyone's guess!",
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: new Date('2025-12-07T17:00:00.000Z'),
        end: new Date('2025-12-07T20:00:00.000Z'),
        isTimeTBD: true,
        participants: [],
        tags: [],
      },
      owner: {
        userId: -1,
        primaryLiveStream: 'twitch',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        username: 'highrollersdnd',
        profileImage:
          'https://static-cdn.jtvnw.net/jtv_user_pictures/9005fcb8-2b5a-4c86-a625-e865a816f5cd-profile_image-70x70.png',
        twitchLogin: 'highrollersdnd',
        tiltifySlug: '',
        tiltifyUrl: '',
        primaryColor: '#1E95EF',
        accentColor: '#F67932',
      },
    },
  ]

  const allEvents = [...week1]

  allEvents.sort((a, b) => a.stream.start.getTime() - b.stream.start.getTime())

  return allEvents
}

export async function getHardCodedEventsJustYogs(
  year: number = 2025,
): Promise<UserStream[]> {
  const ownerJJ = {
    userId: -1,
    primaryLiveStream: 'twitch',
    createdAt: new Date('2020-01-01T00:00:00.000Z'),
    username: 'Yogscast',
    profileImage:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/29532548-dedd-4898-84cb-62782f64ef30-profile_image-70x70.png',
    twitchLogin: 'yogscast',
    tiltifySlug: '',
    tiltifyUrl: 'https://tiltify.com/@yogscast',
    primaryColor: '#1E95EF',
    accentColor: '#F67932',
  }

  // Load the schedule entry for the given year from Astro content collections
  const schedule = await getEntry('schedules', `${year ?? 2024}`)
  if (!schedule) {
    const now = new Date()
    return []
  }
  const result = await getYogsScheduleFromContent(year ?? 2024)

  return result.streams.map((s) => {
    return {
      stream: {
        id: 1,
        scheduleId: 1,
        createdBy: 1,
        title: s.title,
        visible: true,
        subtitle: s.subtitle ? s.subtitle : null,
        description: s.description ? s.description : null,
        youtubeVodUrl: null,
        twitchVodUrl: null,
        start: s.start,
        end: s.end,
        isTimeTBD: false,
        // Note: Yogs schedule creators are not JJ users; to keep type safety with UserDisplaySchema,
        // we omit mapping them here.
        participants: s.creators?.map(yogsCreatorToUser) ?? [],
        tags: [],
      },
      owner: ownerJJ,
    }
  })
}

function yogsCreatorToUser(yog: YogsCreator): UserDisplay {
  // Helper to extract platform info from links
  const links = yog.links ?? []
  const twitchLink = links.find((l) => l.type.toLowerCase() === 'twitch')
  const youtubeLink = links.find((l) => l.type.toLowerCase() === 'youtube')

  const user: UserDisplay = {
    userId: -1,
    primaryLiveStream: twitchLink ? 'twitch' : 'youtube',
    createdAt: new Date('2020-01-01T00:00:00.000Z'),
    username: yog.name,
    profileImage:
      yog.imageUrl ||
      'https://static-cdn.jtvnw.net/jtv_user_pictures/29532548-dedd-4898-84cb-62782f64ef30-profile_image-70x70.png',
    twitchLogin: twitchLoginFromUrl(twitchLink?.url),
    youtubeUrl: youtubeLink?.url ?? null,
    tiltifySlug: '',
    tiltifyUrl: '',
    primaryColor: yog.color || null,
    accentColor: null,
  }

  return user
}

function twitchLoginFromUrl(url?: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    // Expect formats like /{login} or /videos/{id}; take first path segment
    const seg = u.pathname.split('/').filter(Boolean)[0]
    return seg || null
  } catch {
    // Fallback: naive parsing
    const m = url.match(/twitch\.tv\/([^/?#]+)/i)
    return m?.[1] ?? null
  }
}
