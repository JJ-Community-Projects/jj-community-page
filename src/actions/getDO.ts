import {type ActionAPIContext, ActionError} from "astro:actions";


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
    throw new Error('UserDO not available');
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
    throw new Error('ScheduleEditorDO not available');
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
    throw new Error('TeamDO not available');
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
