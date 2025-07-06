import type {UserLiveState} from "../lib/db/models/user-ui.ts";
import {TinybaseDO} from "./TinybaseDO.ts";
import type {Id, IdAddedOrRemoved} from "tinybase";


export class AllUserLiveStatusDO extends TinybaseDO {

  protected namespace(): string {
    return 'AllUserLiveStatusDO'
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
      return
    }
    this.store.setRow('liveState', `${state.id}`, {
      id: state.id,
      name: state.name,
      slug: state.slug,
      isLive: state.isLive,
      primaryLiveStream: state.primaryLiveStream,
      channel: JSON.stringify(state.channel),
    })
  }

}
