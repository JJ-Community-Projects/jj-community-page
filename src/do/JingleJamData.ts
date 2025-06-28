import {DurableObject} from "cloudflare:workers";
import type {JingleJamResponse} from "./types/JJAPIModel.ts";
import {DateTime} from "luxon";
import {drizzle} from "drizzle-orm/d1";
import {durableObjectsTable} from "../lib/db/schema/schema.ts";

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

  /**
   * Constructor for the JingleJamData Durable Object
   *
   * Initializes the Durable Object and sets up the alarm system for periodic data refresh.
   * Also registers the Durable Object in the database for tracking purposes.
   *
   * @param ctx - The Durable Object state context
   * @param env - The environment variables and bindings
   */
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.setAlarm(this.getNextAlarmMills());
      const n = await this.ctx.storage.getAlarm()
      console.log('JingleJamData', 'constructor', 'alarm', n);
    });
    const db = drizzle(env.DB);

    db.insert(durableObjectsTable).values({
      namespace: 'JingleJamData',
      id: ctx.id.toString(),
    })
      .returning()
      .then(r => {
        console.log('JingleJamData', r);
      })
      .catch((err) => {
        console.error('JingleJamData', err);
      })
  }


  /**
   * Handles incoming requests to the Durable Object
   *
   * This method serves as the main entry point for interacting with the JingleJamData Durable Object.
   * It retrieves JingleJam data from storage if available, or fetches fresh data from the API if needed.
   * After fetching new data, it stores it and sets up the next alarm for periodic refresh.
   *
   * @param request - The incoming request
   * @returns A Response containing the JingleJam data in JSON format
   */
  async fetch(request: Request) {
    const data = await this.getJJData()
    if (data == null) {
      const data = await this.fetchJJData()
      await this.ctx.blockConcurrencyWhile(async () => {
        await this.storeData(data);
        await this.ctx.storage.setAlarm(this.getNextAlarmMills());
        const n = await this.ctx.storage.getAlarm()
        console.log('JingleJamData', 'fetch', 'alarm', n);
      });
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {"content-type": "application/json"},
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {"content-type": "application/json"},
    });
  }

  /**
   * Handles the alarm event for periodic data refresh
   *
   * This method is automatically called when the alarm triggers. It fetches fresh
   * JingleJam data from the API, stores it, and schedules the next alarm.
   * The alarm timing is determined by the current date relative to the JingleJam event:
   * - During JingleJam: Every minute
   * - After JingleJam: Next year's JingleJam start
   * - Before JingleJam: This year's JingleJam start
   */
  async alarm() {
    console.log('JingleJamData', 'alarm');
    const data = await this.fetchJJData()
    await this.ctx.blockConcurrencyWhile(async () => {
      await this.storeData(data);
      await this.ctx.storage.setAlarm(this.getNextAlarmMills());
      const n = await this.ctx.storage.getAlarm()
      console.log('JingleJamData', 'alarm', n);
    });
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
  async getJJData() {
    const data = await this.ctx.storage.get(this.JJ_DATA)
    console.log('JingleJamData', 'getJJData');
    if (data) {
      return data as JingleJamResponse;
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
  async fetchJJData(): Promise<JingleJamResponse> {
    try {
      const response = await fetch(this.env.JJ_DASHBOARD_URL);

      if (!response.ok) {
        throw new Error(`Failed to fetch JingleJam data: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching JingleJam data:', error);
      throw error;
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
  }

  /**
   * Gets a string representation of the next alarm time
   *
   * This method retrieves the timestamp of the next scheduled alarm and
   * converts it to an ISO string format. If no alarm is set, it returns 'none'.
   * This is useful for debugging and monitoring the alarm system.
   *
   * @returns Promise<string> The next alarm time as an ISO string or 'none' if no alarm is set
   */
  async getNextAlarmStr() {
    const n = await this.ctx.storage.getAlarm();
    if (n == null) {
      return 'none';
    }
    const date = new Date(n)
    console.log('JingleJamData', 'nextAlarm', n, date);
    return date.toISOString();
  }


  /**
   * Gets the current year
   *
   * This helper method returns the current year, which is used for
   * calculating JingleJam event dates.
   *
   * @returns number The current year
   * @private
   */
  private currentYear() {
    const date = new Date();
    return date.getFullYear()
  }

  /**
   * Calculates the start date and time of the JingleJam event for the current year
   *
   * JingleJam traditionally starts on December 1st at 5:00 PM London time.
   * This method creates a DateTime object representing that moment for the current year.
   *
   * @returns DateTime The start date and time of JingleJam for the current year
   * @private
   */
  private jjStart() {
    return DateTime.fromObject({
      year: this.currentYear(),
      month: 12,
      day: 1,
      hour: 17
    }, {
      zone: 'Europe/London',
    })
  }

  /**
   * Calculates the start date and time of the JingleJam event for the next year
   *
   * This method creates a DateTime object representing the start of JingleJam
   * for the year following the current year. This is used for scheduling alarms
   * when the current year's JingleJam has already ended.
   *
   * @returns DateTime The start date and time of JingleJam for the next year
   * @private
   */
  private nextJJStart() {
    return DateTime.fromObject({
      year: this.currentYear() + 1,
      month: 12,
      day: 1,
      hour: 17
    }, {
      zone: 'Europe/London',
    })
  }

  /**
   * Calculates the end date and time of the JingleJam event for the current year
   *
   * JingleJam traditionally ends on December 15th at 1:00 AM London time.
   * This method creates a DateTime object representing that moment for the current year.
   *
   * @returns DateTime The end date and time of JingleJam for the current year
   * @private
   */
  private jjEnd() {
    return DateTime.fromObject({
      year: this.currentYear(),
      month: 12,
      day: 15,
      hour: 1,
    }, {
      zone: 'Europe/London',
    })
  }

  /**
   * Determines if the current date is during the JingleJam event
   *
   * This method checks if the current date and time falls between the start and end
   * of the JingleJam event for the current year. This is used to determine the
   * frequency of data refresh during the event.
   *
   * @returns boolean True if the current date is during JingleJam, false otherwise
   * @private
   */
  private isJJ() {
    const now = DateTime.now()
    const start = this.jjStart()
    const end = this.jjEnd()
    return now >= start && now <= end;
  }

  /**
   * Determines if the current date is after the JingleJam event for the current year
   *
   * This method checks if the current date and time is after the end of the
   * JingleJam event for the current year. This is used to determine when to
   * schedule the next alarm for data refresh.
   *
   * @returns boolean True if the current date is after JingleJam, false otherwise
   * @private
   */
  private isAfterJJ() {
    const now = DateTime.now()
    const end = this.jjEnd()
    return now > end;
  }

  /**
   * Calculates the timestamp for the next alarm in milliseconds
   *
   * This method determines when the next data refresh should occur based on the current date
   * relative to the JingleJam event:
   * - During JingleJam: Every minute to keep data fresh
   * - After JingleJam: Next year's JingleJam start date
   * - Before JingleJam: This year's JingleJam start date
   *
   * This dynamic scheduling ensures that data is refreshed frequently during the event
   * but conserves resources during the rest of the year.
   *
   * @returns number The timestamp for the next alarm in milliseconds
   * @private
   */
  private getNextAlarmMills() {
    if (this.isJJ()) {
      return DateTime.now()
        .plus({
          minute: 1,
        })
        .toMillis()
    }
    if (this.isAfterJJ()) {
      const now = this.nextJJStart()
      return now.toMillis()
    }
    const now = this.jjStart()
    return now.toMillis()
  }


}
