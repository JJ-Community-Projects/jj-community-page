import {implement, ORPCError} from '@orpc/server'
import {dbMiddleware} from '../../middleware/dbMiddleware.ts'
import {authMiddleware} from '../../middleware/authMiddleware.ts'
import {scheduleOwnerOrEditorMiddleware} from '../scheduleEditing/middleware.ts'
import {DurableEventIterator} from '@orpc/experimental-durable-event-iterator'
import {normalizeInitPayloadDates} from '../scheduleEditing/scheduleEditingTypes.ts'
import {ensureDraftInitialized, loadDraftSnapshot} from '../scheduleEditing/utils.ts'
import {scheduleEditingChannels} from './channels.ts'
import type {ScheduleEditingObject} from './do/ScheduleEditingObject.ts'
import {privateScheduleEditingWSContract} from './contract.ts'

const os = implement(privateScheduleEditingWSContract)

export const streamDraftWS = os.streamDraftWS
  .use(authMiddleware)
  .use(dbMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({context, input}) => {
    const {db, env, userId} = context;
    const {scheduleId} = input;
    try {
      await ensureDraftInitialized(db, scheduleId, userId);
      const snapshot = await loadDraftSnapshot(db, scheduleId);
      const initPayload = normalizeInitPayloadDates({
        ...snapshot,
        // Ensure streams include lock metadata required by DraftStreamSchema
        streams: snapshot.streams.map((s: any) => ({...s, lockedBy: s.lockedBy ?? null}))
      } as any);

      const channelId = scheduleEditingChannels.edit(scheduleId);
      const DO = env.ScheduleEditingObject;
      const stub = DO.get(DO.idFromName(channelId));
      // Seed init snapshot to DO and emit init event
      await stub.publishInit(scheduleId, userId, initPayload);
      return new DurableEventIterator<ScheduleEditingObject>(channelId, { signingKey: env!.ORPC_DEI_SIGNING_KEY });
    } catch (err) {
      console.error('streamDraftWS error', err);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream schedule draft (WS)'});
    }
  })

export const privateScheduleEditingWSRouter = { streamDraftWS }
