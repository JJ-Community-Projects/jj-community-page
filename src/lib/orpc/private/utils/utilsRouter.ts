import { os } from '@orpc/server'
import { utilsImpl } from './impl.ts'

export const utilsRouter = os.router(utilsImpl)
