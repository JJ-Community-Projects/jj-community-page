import {z} from "zod/v4";
import {oc, type} from "@orpc/contract";
import type {ClientDurableEventIterator} from "@orpc/experimental-durable-event-iterator/client";
import type {DurableEventIteratorObject} from "@orpc/experimental-durable-event-iterator";
import {EditChannelMessageSchema} from "../scheduleEditing/scheduleEditingTypes.ts";

// Types inferred from schemas
type EditChannelMessage = z.infer<typeof EditChannelMessageSchema>;

// Durable Event Iterator object interface (payloads must match DO publishEvent payloads)
interface IScheduleEditingObject
  extends DurableEventIteratorObject<EditChannelMessage> {
}

/**
 * Real-time stream for schedule draft editing channel (authenticated + authorized)
 */
const streamDraftWSContract = oc
  .input(z.object({scheduleId: z.number().int().positive()}))
  .output(type<ClientDurableEventIterator<IScheduleEditingObject, never>>());

export const privateScheduleEditingWSContract = {streamDraftWS: streamDraftWSContract};
