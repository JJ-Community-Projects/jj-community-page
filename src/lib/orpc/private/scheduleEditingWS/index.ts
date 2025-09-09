import { privateScheduleEditingWSRouter as streamRouter } from './impl.ts'
import { streamsRouter } from './streams/impl.ts'
import { tagsRouter } from './tags/impl.ts'
import { participantsRouter } from './participants/impl.ts'
import { scheduleMetaRouter } from './scheduleMeta/impl.ts'

export const privateScheduleEditingWSRouter = {
  ...scheduleMetaRouter,
  ...streamsRouter,
  ...tagsRouter,
  ...participantsRouter,
  streamDraftWS: streamRouter.streamDraftWS,
}
