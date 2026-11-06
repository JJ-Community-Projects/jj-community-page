// Static fixtures for the schedule overlay previews (`?demo=1`), shown when the editor has no
// user or team to load. Never rendered on a live OBS URL unless the param is appended explicitly.

const HOUR = 60 * 60 * 1000

const STREAMS = [
  {
    title: 'Jingle Jam kick-off',
    subtitle: 'Opening night with the community',
    color: '#d4202f',
  },
  {
    title: 'Cozy farming',
    subtitle: 'Building a winter farm',
    color: '#2f6fd4',
  },
  { title: 'Charity speedruns', subtitle: null, color: '#1f9d6b' },
  {
    title: 'Board game night',
    subtitle: 'With viewer votes',
    color: '#a43fd1',
  },
  {
    title: 'Retro marathon',
    subtitle: 'Classics until the goal is hit',
    color: '#e08a1a',
  },
  { title: 'Art stream', subtitle: 'Drawing donor requests', color: '#d43f8d' },
  { title: 'Puzzle hour', subtitle: null, color: '#2a9fb5' },
  {
    title: 'Late-night chat',
    subtitle: 'Thanking every donor',
    color: '#5b6bd4',
  },
  {
    title: 'Co-op chaos',
    subtitle: 'Four players, one controller',
    color: '#7a9a1f',
  },
  { title: 'Finale', subtitle: 'Last push for the total', color: '#d4202f' },
]

const OWNERS = ['Streamer One', 'Streamer Two', 'Streamer Three']

/** Ten streams from "live now" over the next days, cut to `limit`. */
function demoBlocks(limit: number) {
  const hour = Math.floor(Date.now() / HOUR) * HOUR
  return STREAMS.slice(0, limit).map((stream, i) => {
    // The first stream is live; the rest follow every 5 hours
    const start = new Date(hour - HOUR + i * 5 * HOUR)
    return {
      id: i + 1,
      ...stream,
      start,
      end: new Date(start.getTime() + 3 * HOUR),
    }
  })
}

export function demoUserSchedule(timezone: string, limit: number) {
  return {
    schedule: { id: 1, name: 'My Jingle Jam schedule', slug: 'demo' },
    timezone,
    blocks: demoBlocks(limit),
  }
}

export function demoTeamSchedule(timezone: string, limit: number) {
  return {
    schedule: { id: 1, name: 'Team schedule', slug: 'demo' },
    timezone,
    blocks: demoBlocks(limit).map((block, i) => ({
      ...block,
      owner: {
        userId: (i % OWNERS.length) + 1,
        username: OWNERS[i % OWNERS.length],
        profileImage: null,
      },
    })),
  }
}
