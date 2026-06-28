// Runnable with: npx tsx src/do/jingleJamData-v2/__tests__/projections.test.ts
// (the repo has no vitest runner; existing *.test.ts are tsx scripts.)
import assert from 'node:assert'
import type { CampaignRow, CauseRow } from '../schema.ts'
import {
  toCampaignTV,
  toCauseTV,
  toCommunityCampaign,
  toRawCampaign,
  type UserWithTags,
} from '../projections.ts'

const baseCampaign: CampaignRow = {
  id: 'c1',
  year: 2025,
  slug: 'campaign-slug',
  user_slug: 'user-slug',
  cause_id: 'cause1',
  name: 'My Campaign',
  description: 'desc',
  url: 'https://tiltify.com/@user/campaign',
  start_time: '2025-12-01T00:00:00Z',
  raised: 100,
  goal: 1000,
  previous_goal: 500,
  user_name: 'User Name',
  user_avatar: 'https://img/avatar.png',
  user_url: 'https://tiltify.com/@user',
  twitch_login: 'userlogin',
  twitch_id: '12345',
  twitch_name: 'UserLogin',
  twitch_avatar: 'https://twitch/avatar.png',
  is_live: 1,
  youtube_url: '@userchannel',
}

// toCampaignTV with a resolved + live twitch identity
{
  const tv = toCampaignTV(baseCampaign, 1.25, 1.15)
  assert.equal(tv.tiltifySlug, 'user-slug')
  assert.equal(tv.campaignName, 'My Campaign')
  assert.equal(tv.tiltifyName, 'User Name')
  assert.equal(tv.tiltifyCauseId, 'cause1')
  assert.equal(tv.avatar, 'https://img/avatar.png') // tiltify avatar, not twitch
  assert.equal(tv.raised.gbp, 100)
  assert.equal(tv.raised.usd, 125)
  assert.equal(tv.raised.euro, 115)
  assert.equal(tv.goal.gbp, 1000)
  assert.ok(tv.twitch)
  assert.equal(tv.twitch!.name, 'UserLogin')
  assert.equal(tv.twitch!.avatar, 'https://twitch/avatar.png')
  assert.equal(tv.twitch!.isLive, true)
  assert.equal(tv.twitch!.url, 'https://twitch.tv/userlogin')
}

// toCampaignTV with no resolved twitch id -> twitch undefined
{
  const row: CampaignRow = { ...baseCampaign, twitch_id: '', is_live: 0 }
  const tv = toCampaignTV(row, 1, 1)
  assert.equal(tv.twitch, undefined)
}

// toCommunityCampaign: twitch/youtube as URLs, tags + schedule joined
{
  const tags: UserWithTags[] = [
    {
      userId: 1,
      tiltifySlug: 'user-slug',
      tags: [{ id: 1, name: 'Tag', slug: 'tag', color: '#fff', usage: 3 }],
    },
  ]
  const tagMap = new Map(tags.map((u) => [u.tiltifySlug, u]))
  const schedMap = new Map([['user-slug', 'my-schedule']])
  const c = toCommunityCampaign(baseCampaign, 1.25, 1.15, tagMap, schedMap)
  assert.equal(c.campaignName, 'My Campaign')
  assert.equal(c.tiltifyCauseId, 'cause1')
  assert.equal(c.avatar, 'https://twitch/avatar.png') // twitch avatar preferred
  assert.equal(c.twitch, 'https://twitch.tv/userlogin')
  assert.equal(c.youtube, 'https://www.youtube.com/@userchannel')
  assert.equal(c.isTwitchLive, true)
  assert.equal(c.scheduleUrl, '/schedules/my-schedule')
  assert.equal(c.tags.length, 1)
}

// toCauseTV
{
  const cause: CauseRow = {
    id: 'cause1',
    year: 2025,
    name: 'Cause',
    logo: 'https://logo',
    description: 'cdesc',
    url: 'https://cause',
    donate_url: 'https://donate',
    raised: 200,
  }
  const tv = toCauseTV(cause, 1.25, 1.15)
  assert.equal(tv.id, 'cause1')
  assert.equal(tv.donateUrl, 'https://donate')
  assert.equal(tv.raised.usd, 250)
}

// toRawCampaign rebuilds the nested JJ API user shape
{
  const raw = toRawCampaign(baseCampaign)
  assert.equal(raw.id, 'c1')
  assert.equal(raw.causeId, 'cause1')
  assert.equal(raw.user.name, 'User Name')
  assert.equal(raw.user.slug, 'user-slug')
  assert.equal(raw.goal, 1000)
}

console.log('projections.test.ts: all assertions passed')
