import type {APIRoute} from "astro";
import {TwitchRepo} from "../../../../../lib/db/repos/TwitchRepo.ts";
import {getDB} from "../../../../../lib/db/db.ts";
import {TwitchLiveNotifierQueue} from "../../../../../queues/TwitchLiveNotifierQueue.ts";

export const GET: APIRoute = async (ctx) => {
  // Get the userId from the URL parameters
  const userId = ctx.params.userId;
  if (!userId) {
    return new Response('User ID is required', {status: 400});
  }

  // Get database connection and create TwitchRepo instance
  const twitchRepo = new TwitchRepo(ctx.locals.runtime.env, 'api');

  try {
    // Get the twitch channel by userId
    const channel = await twitchRepo.getChannelByUserId(parseInt(userId));

    if (!channel) {
      return new Response('Twitch channel not found for this user', {status: 404});
    }

    // Check if a stream exists for this channel
    const existingStream = await twitchRepo.getStreamByUserId(channel.id);

    let result;

    if (existingStream) {
      // If a stream exists, delete it
      await twitchRepo.deleteStream(existingStream.twitchId);

      result = {
        action: 'deleted',
        stream: existingStream
      };
    } else {
      // If no stream exists, insert a dummy stream
      const dummyStream = {
        streamId: `dummy-${Date.now()}`,
        twitchId: channel.id,
        userLogin: channel.login,
        userName: channel.displayName,
        gameId: 'dummy-game-id',
        gameName: 'Test Game',
        type: 'live',
        title: 'Test Stream',
        viewerCount: 0,
        startedAt: new Date().toISOString(),
        language: 'en',
        thumbnailUrl: channel.profileImageUrl || '',
        tagIds: null,
        isMature: false
      };

      await twitchRepo.insertStream(dummyStream);

      result = {
        action: 'inserted',
        stream: dummyStream
      };
    }

    const notifier = new TwitchLiveNotifierQueue()

    await notifier.send([channel.id], ctx.locals.runtime.env)

    // Return the result
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in liveToggle endpoint:', error);
    return new Response('Internal Server Error', {status: 500});
  }
}
