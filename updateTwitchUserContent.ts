/*
  Script: Refresh src/content/twitchUser/*.yaml from the Twitch API
  Reads TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET from the environment or .env.
  Exits non-zero when a refresh is needed but fails.

  Run: npm run content:update-twitch
*/
import 'dotenv/config'
import { updateTwitchUser } from './src/content/updateTwitchUser.ts'

try {
  await updateTwitchUser({
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
  })
} catch (e) {
  console.error('Failed to update twitch users', e)
  process.exit(1)
}
