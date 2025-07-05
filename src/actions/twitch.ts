import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";


export const twitch = {
  validatedTwitchUrl: defineAction({
    input: z.string().url(),
    handler: async (url, context) => {
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }
      const userId = user.id;

      const DO = context.locals.runtime.env.TwitchAPIDO
      const DO_ID = DO.idFromName(userId);
      const stub = DO.get(DO_ID)

      if (!stub) {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR'});
      }

      const components = url.split('/')
      const name = components[components.length - 1];

      const {data, error} = await stub.fetchUserByLogin(name)

      if (error) {
        throw new ActionError({code: 'BAD_REQUEST', message: error.description});
      }
      if(data.data.length === 0){
        throw new ActionError({code: 'NOT_FOUND'});
      }

      return data.data[0]
    }
  })
}
