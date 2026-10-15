import type {TokenData, UserResult} from "./model/TwitchAPIModel.ts";

export interface TwitchCredentials {
  clientId: string
  clientSecret: string
}

/**
 * get token from twitch
 * @return {Promise}
 */
export function getToken({clientId, clientSecret}: TwitchCredentials): Promise<TokenData> {
  const url = "https://id.twitch.tv/oauth2/token?" +
    "client_id=" + clientId +
    "&client_secret=" + clientSecret +
    "&grant_type=client_credentials";
  return fetch(url, {method: "POST"}).then(res => res.json())
}

export async function getTwitchData(channelId: string, access_token: string, clientId: string) {
  const url = `https://api.twitch.tv/helix/channels?broadcaster_id=${channelId}`
  const headers = {
    "Authorization": "Bearer " + access_token,
    "Client-Id": clientId,
  }
  return fetch(url, {headers}).then(res => res.json())
}

export async function getTwitchDataByLogin(login: string, access_token: string, clientId: string) {
  const url = `https://api.twitch.tv/helix/channels?login=${login}`
  const headers = {
    "Authorization": "Bearer " + access_token,
    "Client-Id": clientId,
  }
  return fetch(url, {headers}).then(res => res.json())
}

export async function getTwitchDataByLogins(logins: string[], access_token: string, clientId: string): Promise<UserResult> {
  const q = logins.join('&login=')
  const url = `https://api.twitch.tv/helix/users?login=${q}`
  const headers = {
    "Authorization": "Bearer " + access_token,
    "Client-Id": clientId,
  }
  return fetch(url, {headers}).then(res => res.json())
}
