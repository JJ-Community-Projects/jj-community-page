import {RpcTarget} from "cloudflare:workers";
import {UserLiveStatusDO} from "./UserLiveStatusDO.ts";
import type {UserLiveState} from "../lib/db/models/user-ui.ts";

export class RpcUserLiveStatusDO extends RpcTarget {
  private doIdentifier: string;
  private userLiveStatusDO: UserLiveStatusDO
  protected env: Env

  constructor(doIdentifier: string, userLiveStatusDO: UserLiveStatusDO, env: Env) {
    super();
    this.userLiveStatusDO = userLiveStatusDO;
    this.doIdentifier = doIdentifier;
    this.env = env;
  }

  setUserLiveState(state: UserLiveState) {
    console.log('RpcUserLiveStatusDO', 'setUserLiveState', state);
    return this.userLiveStatusDO.setUserLiveState(state);
  }


  fetch(request: Request) {
    return this.userLiveStatusDO.fetch(request)
  }
}
