import { DurableObject } from 'cloudflare:workers'
import type { JingleJamResponse } from './types/JJAPIModel.ts'
import { getDB } from '../lib/db/db.ts'
import { jjCauses, jjCampaign } from '../lib/db/schema/jj-api-schema.ts'

/**
 * JingleJamData Durable Object
 *
 * This Durable Object is responsible for fetching, storing, and managing JingleJam event data.
 * It provides a centralized way to access JingleJam information across the application.
 *
 * Key features:
 * - Fetches JingleJam data from the Tiltify API
 * - Caches data in Durable Object storage
 * - Uses an alarm system to periodically refresh data
 * - Provides methods to determine JingleJam event timing (start, end, etc.)
 *
 * The data structure follows the JingleJamResponse interface, which includes:
 * - Event details (start/end dates, year)
 * - Fundraising statistics (total raised, donations count)
 * - Collections information
 * - Historical data
 * - Causes and campaigns
 *
 * Usage:
 * ```typescript
 * // Get a stub for the JingleJamData Durable Object
 * const id = env.JingleJamData.idFromName("singleton");
 * const stub = env.JingleJamData.get(id);
 *
 * // Fetch JingleJam data
 * const response = await stub.fetch("https://example.com/jingleJamData");
 * const data = await response.json();
 * ```
 */
export class JingleJamData extends DurableObject<Env> {
  /**
   * Storage key for JingleJam data in the Durable Object's storage
   * @private
   */
  private JJ_DATA = 'JJ_DATA'

  async refresh() {
    const data = await this.fetchJJData()
    await this.storeData(data)
  }

  async getCauses() {
    const data = await this.getJJData()
    return data?.causes
  }

  async getCampaigns() {
    const data = await this.getJJData()
    return data?.campaigns
  }

  /**
   * Retrieves JingleJam data from Durable Object storage
   *
   * This method attempts to retrieve previously stored JingleJam data from the
   * Durable Object's storage. If data is found, it is returned as a JingleJamResponse.
   * If no data is found, null is returned.
   *
   * @returns Promise<JingleJamResponse | null> The stored JingleJam data or null if not found
   */
  private async getJJData() {
    const data = await this.ctx.storage.get(this.JJ_DATA)
    console.log('JingleJamData', 'getJJData')
    if (data) {
      return data as JingleJamResponse
    }
    return null
  }

  /**
   * Fetches fresh JingleJam data from the Tiltify API
   *
   * This method makes an HTTP request to the JingleJam dashboard URL (specified in env.JJ_DASHBOARD_URL)
   * to retrieve the latest JingleJam event data. It handles error cases and logs any issues
   * that occur during the fetch operation.
   *
   * @throws Error if the fetch operation fails or returns a non-OK response
   * @returns Promise<JingleJamResponse> The fresh JingleJam data from the API
   */
  private async fetchJJData(): Promise<JingleJamResponse> {
    try {
      const response = await fetch(this.env.JJ_DASHBOARD_URL)

      if (!response.ok) {
        throw new Error(
          `Failed to fetch JingleJam data: ${response.status} ${response.statusText}`,
        )
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching JingleJam data:', error)
      throw error
    }
  }

  /**
   * Stores JingleJam data in the Durable Object's storage
   *
   * This method saves the provided JingleJam data to the Durable Object's storage
   * using the JJ_DATA key. This allows the data to persist across requests and
   * be retrieved later using the getJJData method.
   *
   * @param data - The JingleJam data to store
   * @private
   */
  private async storeData(data: JingleJamResponse) {
    await this.ctx.storage.put(this.JJ_DATA, data)

    const db = getDB(this.env)

    const { campaigns, causes } = data

    await db.batch([
      db.insert(jjCauses).values(
        causes.map((cause) => {
          return {
            id: cause.id,
            year: data.event.year,
            name: cause.name,
            logo: cause.logo,
            description: cause.description,
            url: cause.url,
            donateUrl: cause.donateUrl,
            raised: cause.raised,
          }
        }),
      ),
      db.insert(jjCampaign).values(
        campaigns.list.map((c) => {
          return {
            year: data.event.year,
            causeId: c.causeId,
            name: c.name,
            description: c.description,
            slug: c.slug,
            url: c.url,
            startTime: c.startTime,
            raised: c.raised,
            goal: c.goal,
            livestream: {
              channel: c.livestream?.channel ?? '',
              type: c.livestream?.type ?? '',
            },
            userId: c.user.id,
            userName: c.user.name,
            userSlug: c.user.slug,
            userAvatar: c.user.avatar,
            userUrl: c.user.url,
          }
        }),
      )
    ])
  }
}
