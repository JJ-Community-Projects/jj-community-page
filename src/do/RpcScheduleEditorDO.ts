import {RpcTarget} from "cloudflare:workers";
import {ScheduleEditorDO} from "./ScheduleEditorDO.ts";
import {createUnauthorizedResponse} from "./utils.ts";
import {validateSessionTokenFromEnv} from "../functions/session.ts";

export class RpcScheduleEditorDO extends RpcTarget {
  private scheduleEditorDO: ScheduleEditorDO;
  private doIdentifier: string;
  protected env: Env

  constructor(doIdentifier: string, scheduleEditorDO: ScheduleEditorDO, env: Env) {
    super();
    this.scheduleEditorDO = scheduleEditorDO;
    this.doIdentifier = doIdentifier;
    this.env = env;
    this.scheduleEditorDO.init(doIdentifier)
  }

  // Public methods that forward to the DO methods and inject the identifier

  async toggleVisibility() {
    return this.scheduleEditorDO.toggleVisibility(this.doIdentifier);
  }

  async saveToDB() {
    return this.scheduleEditorDO.saveToDB(this.doIdentifier);
  }

  // Methods that don't need the identifier can be forwarded directly

  async getTables() {
    return this.scheduleEditorDO.getTables();
  }

  loadFromDB() {
    return this.scheduleEditorDO.loadFromDB(this.doIdentifier);
  }

  async fetch(req: Request): Promise<Response> {
    return this.scheduleEditorDO.fetch(req)
  }

  /*
  async fetch(request: Request) {
    const token = request.headers.get('token')
    if (!token) {
      return createUnauthorizedResponse()
    }
    const {user, session} = await validateSessionTokenFromEnv(this.env, token)
    if (!user || !session) {
      return createUnauthorizedResponse()
    }
    // TODO: Add permission check for schedule access
    return this.scheduleEditorDO.fetch(request)
  }
  */
}
