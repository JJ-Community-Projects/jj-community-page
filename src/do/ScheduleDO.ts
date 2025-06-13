import {WsServerDurableObject} from "tinybase/synchronizers/synchronizer-ws-server-durable-object";
import {createDurableObjectStoragePersister} from "tinybase/persisters/persister-durable-object-storage";
import {createMergeableStore} from "tinybase";


export class ScheduleDO extends WsServerDurableObject<Env> {

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  createPersister() {
    return createDurableObjectStoragePersister(
      createMergeableStore(),
      this.ctx.storage,
    );
  }

  public save() {

  }

}
