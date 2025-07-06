import type {UserLiveState} from "../lib/db/models/user-ui.ts";
import {TinybaseDO} from "./TinybaseDO.ts";
import type {Id, IdAddedOrRemoved} from "tinybase";
import {RpcUserLiveStatusDO} from "./RpcUserLiveStatusDO.ts";


export class UserLiveStatusDO extends TinybaseDO {

  setMetaData(doIdentifier: string) {
    if (this.store) {
      this.store.setValue('id', doIdentifier);
    }
    this.log('setMetaData', doIdentifier);
    return new RpcUserLiveStatusDO(doIdentifier, this, this.env);
  }

  protected namespace(): string {
    return 'UserLiveStatusDO'
  }

  async onMessage(fromClientId: Id, toClientId: Id, message: string) {
    super.onMessage(fromClientId, toClientId, message)
  }

  onPathId(pathId: Id, addedOrRemoved: IdAddedOrRemoved) {
    super.onPathId(pathId, addedOrRemoved);
  }

  onClientId(pathId: Id, clientId: Id, addedOrRemoved: IdAddedOrRemoved) {
    super.onClientId(pathId, clientId, addedOrRemoved);
  }

  async fetch(request: Request) {
    return this.defaultFetch(request)
  }


  setUserLiveState(state: UserLiveState) {
    if (!this.store) {
      this.log('no store')
      return
    }
    this.store.setValue('state', JSON.stringify(state))
    this.log('UserLiveStatusDO', 'setUserLiveState', state)
  }

}
