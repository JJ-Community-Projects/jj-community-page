/**
 * Types for YouTube API responses and errors
 */

// YouTube API Error Response
export interface YouTubeApiError {
  error: {
    code: number;
    message: string;
    errors: {
      message: string;
      domain: string;
      reason: string;
    }[];
    status: string;
  };
}

// YouTube Channel Thumbnail
export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

// YouTube Channel Thumbnails
export interface YouTubeThumbnails {
  default: YouTubeThumbnail;
  medium: YouTubeThumbnail;
  high: YouTubeThumbnail;
}

// YouTube Channel Snippet
export interface YouTubeChannelSnippet {
  title: string;
  description: string;
  customUrl: string;
  publishedAt: string;
  thumbnails: YouTubeThumbnails;
  localized: {
    title: string;
    description: string;
  };
  country?: string;
}

// YouTube Channel
export interface YouTubeChannel {
  kind: string;
  etag: string;
  id: string;
  snippet: YouTubeChannelSnippet;
}

// YouTube Channel List Response
export interface YouTubeChannelListResponse {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeChannel[];
}

// Result type for fetch functions
export type YouTubeResult<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: YouTubeApiError;
};

/**
 * error:
 * {
 *   "error": {
 *     "code": 403,
 *     "message": "Method doesn't allow unregistered callers (callers without established identity). Please use API Key or other form of API consumer identity to call this API.",
 *     "errors": [
 *       {
 *         "message": "Method doesn't allow unregistered callers (callers without established identity). Please use API Key or other form of API consumer identity to call this API.",
 *         "domain": "global",
 *         "reason": "forbidden"
 *       }
 *     ],
 *     "status": "PERMISSION_DENIED"
 *   }
 * }
 */


/**
 * Detect which type of YouTube URL was provided
 * @param url - YouTube URL (https://youtube.com/@username or https://youtube.com/channel/CHANNEL_ID)
 * @returns 'handle' if URL contains a handle (@username), 'id' if URL contains a channel ID
 */
export function detectType(url: string): 'handle' | 'id' {
  if (!url) {
    throw new Error('URL is required');
  }

  // Check if URL contains a handle (@username)
  if (url.includes('@')) {
    return 'handle';
  }

  // Otherwise assume it's a channel ID
  return 'id';
}

/**
 * Validate a YouTube URL and extract the handle or channel ID
 * @param url - YouTube URL to validate
 * @returns The extracted handle (with @) or channel ID, or null if invalid
 */
export function validatedYoutubeYouTubeUrl(url: string): string | null {
  if (!url) {
    return null;
  }

  try {
    // Create URL object to validate and parse the URL
    const urlObj = new URL(url);

    // Check if it's a YouTube domain
    if (!urlObj.hostname.includes('youtube.com') && !urlObj.hostname.includes('youtu.be')) {
      return null;
    }

    // Handle different URL formats
    if (urlObj.pathname.includes('@')) {
      // Handle format: youtube.com/@username
      const match = urlObj.pathname.match(/@([^\/]+)/);
      return match ? `@${match[1]}` : null;
    } else if (urlObj.pathname.includes('/channel/')) {
      // Handle format: youtube.com/channel/CHANNEL_ID
      const match = urlObj.pathname.match(/\/channel\/([^\/]+)/);
      return match ? match[1] : null;
    } else if (urlObj.pathname.includes('/c/')) {
      // Handle format: youtube.com/c/CUSTOM_URL
      // Note: This doesn't directly give us the channel ID, would need an API call
      return null;
    }

    return null;
  } catch (error) {
    // Invalid URL format
    return null;
  }
}

/**
 * Fetch a YouTube channel by its ID
 *
 * @example result:
 * {
 *   "kind": "youtube#channelListResponse",
 *   "etag": "EFjcS3YUDLiSoZa8DN2NDDBNLBY",
 *   "pageInfo": {
 *     "totalResults": 1,
 *     "resultsPerPage": 5
 *   },
 *   "items": [
 *     {
 *       "kind": "youtube#channel",
 *       "etag": "Yo9QHLoMykkvHiD1uO-8A8ZB10c",
 *       "id": "UCH-_hzb2ILSCo9ftVSnrCIQ",
 *       "snippet": {
 *         "title": "The Yogscast",
 *         "description": "Hello and welcome to The Yogscast! We're a group of friends who love hanging out and playing online multiplayer games like Gmod TTT and Minecraft. And thanks to our channel members, we're able to fund large scale live action videos where we get together IRL and do crazy challenges!\n",
 *         "customUrl": "@yogscast",
 *         "publishedAt": "2008-07-09T21:56:56Z",
 *         "thumbnails": {
 *           "default": {
 *             "url": "https://yt3.ggpht.com/tMbBBpEq85pRgLFvqNm4Gxo1dfY2Ys5WDpcWAWHmgLyJBa9Jf84ParXagqaSxjMUtM-vKvnpSro=s88-c-k-c0x00ffffff-no-rj",
 *             "width": 88,
 *             "height": 88
 *           },
 *           "medium": {
 *             "url": "https://yt3.ggpht.com/tMbBBpEq85pRgLFvqNm4Gxo1dfY2Ys5WDpcWAWHmgLyJBa9Jf84ParXagqaSxjMUtM-vKvnpSro=s240-c-k-c0x00ffffff-no-rj",
 *             "width": 240,
 *             "height": 240
 *           },
 *           "high": {
 *             "url": "https://yt3.ggpht.com/tMbBBpEq85pRgLFvqNm4Gxo1dfY2Ys5WDpcWAWHmgLyJBa9Jf84ParXagqaSxjMUtM-vKvnpSro=s800-c-k-c0x00ffffff-no-rj",
 *             "width": 800,
 *             "height": 800
 *           }
 *         },
 *         "localized": {
 *           "title": "The Yogscast",
 *           "description": "Hello and welcome to The Yogscast! We're a group of friends who love hanging out and playing online multiplayer games like Gmod TTT and Minecraft. And thanks to our channel members, we're able to fund large scale live action videos where we get together IRL and do crazy challenges!\n"
 *         },
 *         "country": "GB"
 *       }
 *     }
 *   ]
 * }
 *
 * @param id - YouTube channel ID
 * @param env - Environment variables containing the YouTube API key
 * @returns Promise with either the channel data or an error
 */
export async function fetchYoutubeChannelById(id: string, env: Env): Promise<YouTubeResult<YouTubeChannelListResponse>> {
  if (!id) {
    return {
      data: null,
      error: {
        error: {
          code: 400,
          message: "Channel ID is required",
          errors: [{message: "Channel ID is required", domain: "global", reason: "required"}],
          status: "INVALID_ARGUMENT"
        }
      }
    };
  }

  const apiKey = env.YOUTUBE_API_KEY;
  const url = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(id)}&key=${apiKey}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json() as YouTubeApiError;
      return {data: null, error: errorData};
    }

    const data = await response.json() as YouTubeChannelListResponse;
    return {data, error: null};
  } catch (error) {
    return {
      data: null,
      error: {
        error: {
          code: 500,
          message: error instanceof Error ? error.message : "Unknown error",
          errors: [{
            message: error instanceof Error ? error.message : "Unknown error",
            domain: "global",
            reason: "serverError"
          }],
          status: "INTERNAL"
        }
      }
    };
  }
}

/**
 * Fetch a YouTube channel by its handle
 *
 * @example result:
 * {
 *   "kind": "youtube#channelListResponse",
 *   "etag": "EFjcS3YUDLiSoZa8DN2NDDBNLBY",
 *   "pageInfo": {
 *     "totalResults": 1,
 *     "resultsPerPage": 5
 *   },
 *   "items": [
 *     {
 *       "kind": "youtube#channel",
 *       "etag": "Yo9QHLoMykkvHiD1uO-8A8ZB10c",
 *       "id": "UCH-_hzb2ILSCo9ftVSnrCIQ",
 *       "snippet": {
 *         "title": "The Yogscast",
 *         "description": "Hello and welcome to The Yogscast! We're a group of friends who love hanging out and playing online multiplayer games like Gmod TTT and Minecraft. And thanks to our channel members, we're able to fund large scale live action videos where we get together IRL and do crazy challenges!\n",
 *         "customUrl": "@yogscast",
 *         "publishedAt": "2008-07-09T21:56:56Z",
 *         "thumbnails": {
 *           "default": {
 *             "url": "https://yt3.ggpht.com/tMbBBpEq85pRgLFvqNm4Gxo1dfY2Ys5WDpcWAWHmgLyJBa9Jf84ParXagqaSxjMUtM-vKvnpSro=s88-c-k-c0x00ffffff-no-rj",
 *             "width": 88,
 *             "height": 88
 *           },
 *           "medium": {
 *             "url": "https://yt3.ggpht.com/tMbBBpEq85pRgLFvqNm4Gxo1dfY2Ys5WDpcWAWHmgLyJBa9Jf84ParXagqaSxjMUtM-vKvnpSro=s240-c-k-c0x00ffffff-no-rj",
 *             "width": 240,
 *             "height": 240
 *           },
 *           "high": {
 *             "url": "https://yt3.ggpht.com/tMbBBpEq85pRgLFvqNm4Gxo1dfY2Ys5WDpcWAWHmgLyJBa9Jf84ParXagqaSxjMUtM-vKvnpSro=s800-c-k-c0x00ffffff-no-rj",
 *             "width": 800,
 *             "height": 800
 *           }
 *         },
 *         "localized": {
 *           "title": "The Yogscast",
 *           "description": "Hello and welcome to The Yogscast! We're a group of friends who love hanging out and playing online multiplayer games like Gmod TTT and Minecraft. And thanks to our channel members, we're able to fund large scale live action videos where we get together IRL and do crazy challenges!\n"
 *         },
 *         "country": "GB"
 *       }
 *     }
 *   ]
 * }
 *
 * @param handle - YouTube channel handle (with @ symbol)
 * @param env - Environment variables containing the YouTube API key
 * @returns Promise with either the channel data or an error
 */
export async function fetchYoutubeChannelByHandle(handle: string, env: Env): Promise<YouTubeResult<YouTubeChannelListResponse>> {
  if (!handle) {
    return {
      data: null,
      error: {
        error: {
          code: 400,
          message: "Channel handle is required",
          errors: [{message: "Channel handle is required", domain: "global", reason: "required"}],
          status: "INVALID_ARGUMENT"
        }
      }
    };
  }

  // Ensure handle starts with @
  const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`;

  const apiKey = env.YOUTUBE_API_KEY;
  const url = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(formattedHandle)}&key=${apiKey}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json() as YouTubeApiError;
      return {data: null, error: errorData};
    }

    const data = await response.json() as YouTubeChannelListResponse;
    return {data, error: null};
  } catch (error) {
    return {
      data: null,
      error: {
        error: {
          code: 500,
          message: error instanceof Error ? error.message : "Unknown error",
          errors: [{
            message: error instanceof Error ? error.message : "Unknown error",
            domain: "global",
            reason: "serverError"
          }],
          status: "INTERNAL"
        }
      }
    };
  }
}


/**
 * Fetch multiple YouTube channels by their IDs
 *
 * @example result:
 * {
 *   "kind": "youtube#channelListResponse",
 *   "etag": "EFjcS3YUDLiSoZa8DN2NDDBNLBY",
 *   "pageInfo": {
 *     "totalResults": 1,
 *     "resultsPerPage": 5
 *   },
 *   "items": [
 *     {
 *       "kind": "youtube#channel",
 *       "etag": "Yo9QHLoMykkvHiD1uO-8A8ZB10c",
 *       "id": "UCH-_hzb2ILSCo9ftVSnrCIQ",
 *       "snippet": {
 *         "title": "The Yogscast",
 *         "description": "Hello and welcome to The Yogscast! We're a group of friends who love hanging out and playing online multiplayer games like Gmod TTT and Minecraft. And thanks to our channel members, we're able to fund large scale live action videos where we get together IRL and do crazy challenges!\n",
 *         "customUrl": "@yogscast",
 *         "publishedAt": "2008-07-09T21:56:56Z",
 *         "thumbnails": {
 *           "default": {
 *             "url": "https://yt3.ggpht.com/tMbBBpEq85pRgLFvqNm4Gxo1dfY2Ys5WDpcWAWHmgLyJBa9Jf84ParXagqaSxjMUtM-vKvnpSro=s88-c-k-c0x00ffffff-no-rj",
 *             "width": 88,
 *             "height": 88
 *           },
 *           "medium": {
 *             "url": "https://yt3.ggpht.com/tMbBBpEq85pRgLFvqNm4Gxo1dfY2Ys5WDpcWAWHmgLyJBa9Jf84ParXagqaSxjMUtM-vKvnpSro=s240-c-k-c0x00ffffff-no-rj",
 *             "width": 240,
 *             "height": 240
 *           },
 *           "high": {
 *             "url": "https://yt3.ggpht.com/tMbBBpEq85pRgLFvqNm4Gxo1dfY2Ys5WDpcWAWHmgLyJBa9Jf84ParXagqaSxjMUtM-vKvnpSro=s800-c-k-c0x00ffffff-no-rj",
 *             "width": 800,
 *             "height": 800
 *           }
 *         },
 *         "localized": {
 *           "title": "The Yogscast",
 *           "description": "Hello and welcome to The Yogscast! We're a group of friends who love hanging out and playing online multiplayer games like Gmod TTT and Minecraft. And thanks to our channel members, we're able to fund large scale live action videos where we get together IRL and do crazy challenges!\n"
 *         },
 *         "country": "GB"
 *       }
 *     }
 *   ]
 * }
 *
 * @param ids - Array of YouTube channel IDs
 * @param env - Environment variables containing the YouTube API key
 * @returns Promise with either the channel data or an error
 */
export async function fetchYoutubeChannelByIds(ids: string[], env: Env): Promise<YouTubeResult<YouTubeChannelListResponse>> {
  if (!ids || ids.length === 0) {
    return {
      data: null,
      error: {
        error: {
          code: 400,
          message: "At least one channel ID is required",
          errors: [{message: "At least one channel ID is required", domain: "global", reason: "required"}],
          status: "INVALID_ARGUMENT"
        }
      }
    };
  }

  const apiKey = env.YOUTUBE_API_KEY;

  // Construct URL with multiple id parameters
  const idParams = ids.map(id => `id=${encodeURIComponent(id)}`).join('&');
  const url = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet&${idParams}&key=${apiKey}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json() as YouTubeApiError;
      return {data: null, error: errorData};
    }

    const data = await response.json() as YouTubeChannelListResponse;
    return {data, error: null};
  } catch (error) {
    return {
      data: null,
      error: {
        error: {
          code: 500,
          message: error instanceof Error ? error.message : "Unknown error",
          errors: [{
            message: error instanceof Error ? error.message : "Unknown error",
            domain: "global",
            reason: "serverError"
          }],
          status: "INTERNAL"
        }
      }
    };
  }
}
