import {scheduleMetaRouter} from './scheduleMeta/impl.ts'
import {streamsRouter} from './streams/impl.ts'
import {tagsRouter} from './tags/impl.ts'
import {participantsRouter} from './participants/impl.ts'
import {sseRouter} from './sse/impl.ts'

export const privateScheduleEditingRouter = {
  ...scheduleMetaRouter,
  ...streamsRouter,
  ...tagsRouter,
  ...participantsRouter,
  sse: sseRouter,
}
