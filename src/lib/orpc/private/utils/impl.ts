import { implement, ORPCError } from '@orpc/server'
import { utilsContract } from './contract.ts'

const os = implement(utilsContract)

const checkProfanity = os.checkProfanity
  .handler(async ({ input: message }) => {
    try {
      const res = await fetch('https://vector.profanity.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (res.ok) {
        const json: {
          isProfanity: boolean,
          score: number,
        } = await res.json()
        return json
      } else {
        throw new ORPCError('BAD_REQUEST', { message: 'Profanity check service unavailable' })
      }
    } catch (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to check profanity' })
    }
  })

export const utilsImpl = { checkProfanity }
