import {os} from '@orpc/server'
import {twitchImpl} from './impl.ts'

export const twitchRouter = os.router(twitchImpl)
