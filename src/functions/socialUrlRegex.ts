export function socialUrlRegex() {
  return {
    twitch: /^https?:\/\/(www\.)?twitch\.tv\/([a-zA-Z0-9_]{4,25})$/, // twitch.tv/USERNAME
    twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,15})$/, // twitter.com/USERNAME or x.com/USERNAME
     bsky: /^https?:\/\/(www\.)?bsky\.app\/profile\/((?:[a-zA-Z0-9_.]+@[a-zA-Z0-9.-]+)|(?:[a-zA-Z0-9_.]+\.bsky\.social)|(?:[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))$/, // bsky.app/profile/USER@domain.com or bsky.app/profile/username.bsky.social or bsky.app/profile/username.customdomain.com
    youtube: /^https?:\/\/(www\.)?(youtube\.com\/(channel\/|c\/|user\/|@)[a-zA-Z0-9_-]+|youtube\.com\/.*[?&]v=[a-zA-Z0-9_-]+)$/, // youtube.com/channel/ID, youtube.com/c/NAME, youtube.com/user/USERNAME, youtube.com/@USERNAME
    instagram: /^https?:\/\/(www\.)?instagram\.com\/([a-zA-Z0-9_\.]{1,30})\/?$/, // instagram.com/USERNAME
    tiktok: /^https?:\/\/(www\.)?(tiktok\.com\/@[a-zA-Z0-9_\.]{1,24}|vm\.tiktok\.com\/[a-zA-Z0-9]+)\/?$/, // tiktok.com/@USERNAME or vm.tiktok.com/SHORTCODE
  }
}
