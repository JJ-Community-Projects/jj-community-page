/*
{
  "data": {
    "avatar": {
      "alt": "Short image description used as alternative text.",
      "height": 200,
      "src": "https://tiltify.com/images/example.jpg",
      "width": 200
    },
    "description": "Professional twitch streamer who likes charity!",
    "id": "9fb818e4-d68a-4d71-a2d0-2ba3ca81248b",
    "legacy_id": 392068014,
    "slug": "username",
    "social": {
      "discord": "https://discord.gg/tiltify",
      "facebook": "tiltify",
      "instagram": "tiltify",
      "snapchat": "tiltify",
      "tiktok": "tilitfy",
      "twitch": "tilitfy",
      "twitter": "tiltify",
      "website": "https://tiltify.com",
      "youtube": "UCWcPgWbuWuJX5rHWm6Kb4Vw"
    },
    "total_amount_raised": {
      "currency": "USD",
      "value": "182.32"
    },
    "url": "https://tiltify.com/@username",
    "username": "UserName"
  }
}
 */
export type TiltifyUserAPIResponse = {
  avatar: {
    alt: string;
    height: number;
    src: string;
    width: number;
  };
  description: string;
  id: string;
  legacy_id: number;
  slug: string;
  social: {
    discord: string;
    facebook: string;
    instagram: string;
    snapchat: string;
    tiktok: string;
    twitch: string;
    twitter: string;
    website: string;
    youtube: string;
  };
  total_amount_raised: {
    currency: string;
    value: string;
  };
  url: string;
  username: string;
}
