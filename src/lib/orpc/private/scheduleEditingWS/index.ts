import { privateScheduleEditingWSRouter as streamRouter } from './impl.ts'
import { streamsRouter } from './streams/impl.ts'
import { scheduleMetaRouter } from './scheduleMeta/impl.ts'

export const privateScheduleEditingWSRouter = {
  ...scheduleMetaRouter,
  ...streamsRouter,
  streamDraftWS: streamRouter.streamDraftWS,
}
