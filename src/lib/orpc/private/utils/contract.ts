import { oc } from '@orpc/contract'
import { z } from 'zod'

export const utilsContract = {
  checkProfanity: oc
    .input(z.string())
    .output(z.object({
      isProfanity: z.boolean(),
      score: z.number()
    }))
}
