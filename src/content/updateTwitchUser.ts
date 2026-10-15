import fs from "node:fs";
import path from "node:path";
import * as yaml from 'yaml';
import {getToken, getTwitchDataByLogins, type TwitchCredentials} from "../lib/twitchAPIFuncs.ts";

/**
 * Refreshes src/content/twitchUser/*.yaml for creators whose file is missing or older than 7 days.
 * Throws on failure so callers (scripts/updateTwitchUser.ts) can exit non-zero.
 */
export async function updateTwitchUser(credentials: Partial<TwitchCredentials>) {
  console.log("Updating twitch users");
  const creatorsDir = path.join(process.cwd(), "./src/content/creators");
  const creators = fs.readdirSync(creatorsDir);
  const logins = []
  for (const creator of creators) {
    const creatorPath = path.join(creatorsDir, creator);
    const creatorData = fs.readFileSync(creatorPath, "utf8");
    const yamlObject = yaml.parse(creatorData);
    if (yamlObject.twitchUser) {
      const twitchUser = yamlObject.twitchUser
      const p = path.join(process.cwd(), "./src/content/twitchUser", `${twitchUser}.yaml`);
      if (fs.existsSync(p)) {
        const stats = fs.statSync(p);
        const mtime = stats.mtime;
        const now = new Date();
        const diff = now.getTime() - mtime.getTime();
        const diffDays = diff / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
          continue;
        }
      }
      logins.push(twitchUser);
    }
  }
  if (logins.length === 0) {
    return;
  }
  const {clientId, clientSecret} = credentials
  if (!clientId || !clientSecret) {
    throw new Error(`TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET missing, cannot refresh ${logins.length} twitch users`)
  }
  const token = await getToken({clientId, clientSecret});
  const resp = await getTwitchDataByLogins(logins, token.access_token, clientId)
  if (!resp.data) {
    throw new Error(`Twitch API returned no data: ${JSON.stringify(resp)}`)
  }
  for(const data of resp.data) {
    const yamlData = yaml.stringify(data);
    const p = path.join(process.cwd(), "./src/content/twitchUser", `${data.login}.yaml`);
    fs.writeFileSync(p, yamlData, 'utf8')
  }
}
