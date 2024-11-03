import fs from "node:fs";
import path from "node:path";
import * as yaml from 'yaml';
import {getToken, getTwitchDataByLogins} from "../lib/twitchAPI.ts";

export async function updateTwitchUser() {
  try {
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
    const token = await getToken();
    const resp = await getTwitchDataByLogins(logins, token.access_token)
    for(const data of resp.data) {
      const yamlData = yaml.stringify(data);
      const p = path.join(process.cwd(), "./src/content/twitchUser", `${data.login}.yaml`);
      fs.writeFileSync(p, yamlData, 'utf8')
    }
  } catch (e) {
    console.error(e);
  }
}
