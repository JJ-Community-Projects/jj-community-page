import {type ActionAPIContext, ActionError} from "astro:actions";
import type {RpcUserDO} from "../do/RpcUserDO.ts";
import type {RpcTeamDO} from "../do/RpcTeamDO.ts";
import type {RpcScheduleEditorDO} from "../do/RpcScheduleEditorDO.ts";


type RPCResponse<R> = {
  data: R,
  error: null
} | {
  data: null,
  error: any
}

/**
 * Retrieves a UserDO Durable Object stub for a given user ID.
 *
 * IMPORTANT: This function can only be called inside Astro actions.
 * It requires the ActionAPIContext which is only available within action handlers.
 *
 * @param context - The Astro action context containing runtime environment
 * @param userId - The numeric ID of the user to get the Durable Object for
 * @returns A Durable Object stub that can be used to interact with the UserDO
 * @throws ActionError with INTERNAL_SERVER_ERROR code if:
 *   - The UserDO is not accessible in the environment
 *   - There's an error creating the Durable Object ID
 *   - There's an error getting the Durable Object stub
 */
export function getRPCUserDO(context: ActionAPIContext, userId: number) {
  try {
    const stub = getUserDO(context, userId);
    return stub.setMetaData(`${userId}`)
  } catch (error) {
    console.error('Error getting RPC DO stub:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to access user data'
    });
  }
}

/**
 * Retrieves a ScheduleEditorDO Durable Object stub for a given schedule ID.
 *
 * IMPORTANT: This function can only be called inside Astro actions.
 * It requires the ActionAPIContext which is only available within action handlers.
 *
 * @param context - The Astro action context containing runtime environment
 * @param scheduleId - The numeric ID of the schedule to get the Durable Object for
 * @returns A Durable Object stub that can be used to interact with the ScheduleEditorDO
 * @throws ActionError with INTERNAL_SERVER_ERROR code if:
 *   - The ScheduleEditorDO is not accessible in the environment
 *   - There's an error creating the Durable Object ID
 *   - There's an error getting the Durable Object stub
 */
export function getRPCScheduleEditorDO(context: ActionAPIContext, scheduleId: number) {
  // Get Durable Object stub
  try {
    const stub = getScheduleEditorDO(context, scheduleId);
    return stub.setMetaData(`${scheduleId}`);
  } catch (error) {
    console.error('Error getting RPC DO stub:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to access schedule data'
    });
  }
}

/**
 * Retrieves a TeamDO Durable Object stub for a given team ID.
 *
 * IMPORTANT: This function can only be called inside Astro actions.
 * It requires the ActionAPIContext which is only available within action handlers.
 *
 * @param context - The Astro action context containing runtime environment
 * @param teamId - The numeric ID of the team to get the Durable Object for
 * @returns A Durable Object stub that can be used to interact with the TeamDO
 * @throws ActionError with INTERNAL_SERVER_ERROR code if:
 *   - The TeamDO is not accessible in the environment
 *   - There's an error creating the Durable Object ID
 *   - There's an error getting the Durable Object stub
 */
export function getRPCTeamDO(context: ActionAPIContext, teamId: number) {
  try {
    const stub = getTeamDO(context, teamId);
    return stub.setMetaData(`${teamId}`);
  } catch (error) {
    console.error('Error getting DO stub:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to access team data'
    });
  }
}

/**
 * Retrieves a UserDO Durable Object stub for a given user ID.
 *
 * IMPORTANT: This function can only be called inside Astro actions.
 * It requires the ActionAPIContext which is only available within action handlers.
 *
 * @param context - The Astro action context containing runtime environment
 * @param userId - The numeric ID of the user to get the Durable Object for
 * @returns A Durable Object stub that can be used to interact with the UserDO
 * @throws ActionError with INTERNAL_SERVER_ERROR code if:
 *   - The UserDO is not accessible in the environment
 *   - There's an error creating the Durable Object ID
 *   - There's an error getting the Durable Object stub
 */
export function getUserDO(context: ActionAPIContext, userId: number) {
  // Get Durable Object reference
  let DO;
  try {
    DO = context.locals.runtime.env.UserDO;
  } catch (error) {
    console.error('Error accessing UserDO:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to access user data object'
    });
  }
  if (!DO) {
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'UserDO not available'
    });
  }
  // Create Durable Object ID
  let id;
  try {
    id = DO.idFromName(`${userId}`);
  } catch (error) {
    console.error('Error creating DO ID:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create user identifier'
    });
  }

  // Get Durable Object stub
  try {
    return DO.get(id);
  } catch (error) {
    console.error('Error getting DO stub:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to access user data'
    });
  }
}

/**
 * Retrieves a ScheduleEditorDO Durable Object stub for a given schedule ID.
 *
 * IMPORTANT: This function can only be called inside Astro actions.
 * It requires the ActionAPIContext which is only available within action handlers.
 *
 * @param context - The Astro action context containing runtime environment
 * @param scheduleId - The numeric ID of the schedule to get the Durable Object for
 * @returns A Durable Object stub that can be used to interact with the ScheduleEditorDO
 * @throws ActionError with INTERNAL_SERVER_ERROR code if:
 *   - The ScheduleEditorDO is not accessible in the environment
 *   - There's an error creating the Durable Object ID
 *   - There's an error getting the Durable Object stub
 */
export function getScheduleEditorDO(context: ActionAPIContext, scheduleId: number) {
  // Get Durable Object reference
  let DO;
  try {
    DO = context.locals.runtime.env.ScheduleEditorDO;
  } catch (error) {
    console.error('Error accessing ScheduleEditorDO:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to access schedule editor object'
    });
  }
  if (!DO) {
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'ScheduleEditorDO not available'
    });
  }
  // Create Durable Object ID
  let id;
  try {
    id = DO.idFromName(`${scheduleId}`);
  } catch (error) {
    console.error('Error creating DO ID:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create schedule identifier'
    });
  }

  // Get Durable Object stub
  try {
    return DO.get(id);
  } catch (error) {
    console.error('Error getting DO stub:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to access schedule data'
    });
  }
}

/**
 * Retrieves a TeamDO Durable Object stub for a given team ID.
 *
 * IMPORTANT: This function can only be called inside Astro actions.
 * It requires the ActionAPIContext which is only available within action handlers.
 *
 * @param context - The Astro action context containing runtime environment
 * @param teamId - The numeric ID of the team to get the Durable Object for
 * @returns A Durable Object stub that can be used to interact with the TeamDO
 * @throws ActionError with INTERNAL_SERVER_ERROR code if:
 *   - The TeamDO is not accessible in the environment
 *   - There's an error creating the Durable Object ID
 *   - There's an error getting the Durable Object stub
 */
export function getTeamDO(context: ActionAPIContext, teamId: number) {
  // Get Durable Object reference
  let DO;
  try {
    DO = context.locals.runtime.env.TeamDO;
  } catch (error) {
    console.error('Error accessing TeamDO:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to access team data object'
    });
  }
  if (!DO) {
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'TeamDO not available'
    });
  }
  // Create Durable Object ID
  let id;
  try {
    id = DO.idFromName(`${teamId}`);
  } catch (error) {
    console.error('Error creating DO ID:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create team identifier'
    });
  }

  // Get Durable Object stub
  try {
    return DO.get(id);
  } catch (error) {
    console.error('Error getting DO stub:', error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to access team data'
    });
  }
}

export async function useRpcUserDO<R = void>(context: ActionAPIContext, userId: number, callback: (stub: Rpc.Stub<RpcUserDO>) => (R | Promise<R>), onError: (error: any) => void) {
  try {
    const stub = getUserDO(context, userId);
    const rpc = await stub.setMetaData(`${userId}`)
    const r = await callback(rpc);
    (await rpc)[Symbol.dispose]?.()
    return r
  } catch (e: any) {
    console.error(`useRpcUserDO`, e);
    onError(e)
  }
}

export async function useRpcTeamDO<R = void>(context: ActionAPIContext, teamId: number, callback: (stub: Rpc.Stub<RpcTeamDO>) => (R | Promise<R>), onError: (error: any) => void) {
  try {
    const stub = getTeamDO(context, teamId);
    const rpc = await stub.setMetaData(`${teamId}`)
    const r = await callback(rpc);
    (await rpc)[Symbol.dispose]?.()
    return r
  } catch (e: any) {
    console.error(`useRpcTeamDO`, e);
    onError(e);
  }
}

export async function useRpcScheduleEditorDO<R = void>(context: ActionAPIContext, teamId: number, callback: (stub: Rpc.Stub<RpcScheduleEditorDO>) => (R | Promise<R>), onError: (error: any) => void) {
  try {
    const stub = getScheduleEditorDO(context, teamId);
    const rpc = await stub.setMetaData(`${teamId}`)
    const r = await callback(rpc);
    (await rpc)[Symbol.dispose]?.()
    return r
  } catch (e: any) {
    console.error('useRpcScheduleEditorDO', e);
    onError(e);
  }
}
