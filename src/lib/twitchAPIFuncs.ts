import type {TokenData, UserResult} from "./model/TwitchAPIModel.ts";


/**
 * get token from twitch
 * @return {Promise}
 */
export function getToken(): Promise<TokenData> {
  const url = "https://id.twitch.tv/oauth2/token?" +
    "client_id=" + import.meta.env.TWITCH_CLIENT_ID +
    "&client_secret=" + import.meta.env.TWITCH_CLIENT_SECRET +
    "&grant_type=client_credentials";
  return fetch(url, {method: "POST"}).then(res => res.json())
}

export async function getTwitchData(channelId: string, access_token: string) {
  const url = `https://api.twitch.tv/helix/channels?broadcaster_id=${channelId}`
  const headers = {
    "Authorization": "Bearer " + access_token,
    "Client-Id": import.meta.env.TWITCH_CLIENT_ID,
  }
  return fetch(url, {headers}).then(res => res.json())
}

export async function getTwitchDataByLogin(login: string, access_token: string) {
  const url = `https://api.twitch.tv/helix/channels?login=${login}`
  const headers = {
    "Authorization": "Bearer " + access_token,
    "Client-Id": import.meta.env.TWITCH_CLIENT_ID,
  }
  return fetch(url, {headers}).then(res => res.json())
}

export async function getTwitchDataByLogins(logins: string[], access_token: string): Promise<UserResult> {
  const q = logins.join('&login=')
  const url = `https://api.twitch.tv/helix/users?login=${q}`
  const headers = {
    "Authorization": "Bearer " + access_token,
    "Client-Id": import.meta.env.TWITCH_CLIENT_ID,
  }
  return fetch(url, {headers}).then(res => res.json())
}
