import { getDB } from '../../lib/db/db.ts'
import { desc, eq } from 'drizzle-orm'
import {
  tagUserCountsView,
  userDisplayView,
} from '../../lib/db/schema/views-schema.ts'
import { tags, userTagsTable } from '../../lib/db/schema/tags-schema.ts'

export type UserWithTags = {
  userId: number
  tiltifySlug: string
  tags: Array<{
    name: string
    id: number
    slug: string
    color: string
    usage: number
  }>
}

// User-tags display projection.
//
// Owns storage key: `user:tags:display`.
export class UserTagsBuilder {
  constructor(
    private storage: DurableObjectStorage,
    private env: Env,
  ) {}

  public async buildAndStoreUserTags() {
    const db = getDB(this.env)
    const start = Date.now()

    // 1) Global usage per tag
    const tagUsageRows = await this.getUsedTagsWithUserCounts()
    console.log(
      'buildAndStoreUserTags',
      'tagUsageRows',
      'ms',
      Date.now() - start,
    )
    const usageMap = new Map<number, number>(
      tagUsageRows.map((r) => [r.tagId, r.usage]),
    )

    // 2) Pull all users and their tags
    const rows = await db
      .select({
        userId: userDisplayView.userId,
        tiltifySlug: userDisplayView.tiltifySlug,
        name: tags.name,
        tagId: tags.id,
        tagSlug: tags.slug,
        color: tags.color,
      })
      .from(userDisplayView)
      .leftJoin(userTagsTable, eq(userTagsTable.userId, userDisplayView.userId))
      .leftJoin(tags, eq(userTagsTable.tagId, tags.id))
      .all()
    console.log('buildAndStoreUserTags', 'rows', 'ms', Date.now() - start)

    const byUser = new Map<number, UserWithTags>()

    for (const r of rows) {
      let entry = byUser.get(r.userId)
      if (!entry) {
        entry = {
          userId: r.userId,
          tiltifySlug: r.tiltifySlug ?? null,
          tags: [],
        }
        byUser.set(r.userId, entry)
      }

      if (r.tagId != null) {
        entry.tags.push({
          id: r.tagId,
          name: r.name!,
          slug: r.tagSlug!,
          color: r.color!,
          usage: usageMap.get(r.tagId) ?? 0,
        })
      }
    }

    const result = Array.from(byUser.values())

    // Sort by usage desc, then slug; then keep only top 3 per user
    for (const u of result) {
      u.tags.sort((a, b) => b.usage - a.usage || a.slug.localeCompare(b.slug))
      // if (u.tags.length > 3) u.tags = u.tags.slice(0, 3)
    }

    await this.storage.put('user:tags:display', result)
  }

  public getUserTagsDisplay() {
    return this.storage.get<UserWithTags[]>('user:tags:display')
  }

  private async getUsedTagsWithUserCounts() {
    const db = getDB(this.env)
    return db
      .select({
        tagId: tagUserCountsView.tagId,
        tagSlug: tagUserCountsView.tagSlug,
        color: tags.color,
        usage: tagUserCountsView.userCount,
      })
      .from(tagUserCountsView)
      .leftJoin(tags, eq(tags.id, tagUserCountsView.tagId))
      .orderBy(desc(tagUserCountsView.userCount))
  }
}
