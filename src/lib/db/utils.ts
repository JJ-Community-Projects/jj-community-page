/*
export async function isAuthenticated(ctx: APIContext | ActionAPIContext) {
  const auth = getAuth(ctx)
  const isAuthed = await auth.api
    .getSession({
      headers: ctx.request.headers,
    })
  if (!isAuthed) {
    throw new ActionError({code: 'UNAUTHORIZED'});
  }
  return isAuthed;
}

export async function isScheduleOwnerCheck(ctx: APIContext | ActionAPIContext, scheduleId: string) {
  const session = await isAuthenticated(ctx);
  const db = getDB(ctx);
  const userId = session.user.id;
  const currentYear = new Date().getFullYear();
  const existingSchedule = await db
    .select()
    .from(schedulesTable)
    .where(and(eq(schedulesTable.ownerId, userId), eq(schedulesTable.year, currentYear)))
    .execute();
  if (existingSchedule.length === 0) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: 'Schedule for this user and year does not exist',
    });
  }
  if (existingSchedule[0].id !== scheduleId) {
    throw new ActionError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this schedule',
    });
  }
}

export async function loadFullSchedule(scheduleId: string, db: DrizzleD1Database): Promise<ScheduleEditor> {
  // Get the schedule row using the provided scheduleId.
  const schedule = await db.select().from(schedulesTable).where(eq(schedulesTable.id, scheduleId)).get();
  if (!schedule) {
    throw new Error(`Schedule with id ${scheduleId} not found`);
  }

  // Query all streams associated with the schedule.
  const streams = await db.select().from(streamsTable).where(eq(streamsTable.scheduleId, scheduleId)).all();

  // Query all editors associated with the schedule.
  const editors = await db.select().from(editorsTable).where(eq(editorsTable.scheduleId, scheduleId)).all();

  // Create a schedule object according to the type which omits unwanted fields.
  const scheduleData = {
    title: schedule.title,
  };

  // Remove scheduleId and streamId from each stream returned.
  const streamsData = streams.map(stream => ({
    title: stream.title,
    visible: stream.visible,
    subtitle: stream.subtitle,
    description: stream.description,
    startTime: stream.startTime,
    endTime: stream.endTime,
  }));

  return {
    schedule: scheduleData,
    streams: streamsData,
    editors: editors,
  };
}
*/
