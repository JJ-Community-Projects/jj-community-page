import { UserRepo } from './UserRepo';
import { TeamRepo } from './TeamRepo';
import { ScheduleRepo } from './ScheduleRepo';
import type { APIContext } from 'astro';
import type { ActionAPIContext } from 'astro:actions';
import { getDB } from '../db';
import { DrizzleD1Database } from 'drizzle-orm/d1';

export function createRepos(dbOrContext: DrizzleD1Database | APIContext | ActionAPIContext) {
  const db = dbOrContext instanceof DrizzleD1Database
    ? dbOrContext
    : getDB(dbOrContext);

  return {
    users: new UserRepo(db),
    teams: new TeamRepo(db),
    schedules: new ScheduleRepo(db)
  };
}
