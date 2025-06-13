import {defineAction} from "astro:actions";
import {z} from "astro:content";


export const other = {
  profanity: defineAction({
    input: z.string(),
    handler: async (message, ctx) =>{
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

      }
    }
  })
}
