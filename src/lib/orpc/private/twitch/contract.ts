import {oc} from '@orpc/contract'
import {z} from 'zod'
import {TwitchChannelSchema} from "../../schemas/users.ts";

export const twitchContract = {
  validateTwitchUrl: oc
    .input(z.string().url())
    .output(z.object({
      id: z.string(),
      login: z.string(),
      display_name: z.string(),
      type: z.string(),
      broadcaster_type: z.string(),
      description: z.string(),
      profile_image_url: z.string(),
      offline_image_url: z.string(),
      view_count: z.number(),
      created_at: z.string()
    })),
  getTwitchChannelContract: oc.output(TwitchChannelSchema.nullable())
}
