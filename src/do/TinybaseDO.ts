import {WsServerDurableObject} from "tinybase/synchronizers/synchronizer-ws-server-durable-object";
import {createMergeableStore, type MergeableStore} from "tinybase/mergeable-store";
import {drizzle} from "drizzle-orm/d1";
import {durableObjectsTable} from "../lib/db/schema/schema.ts";
import {
  arrayIsEmpty,
  createPayload,
  createResponse,
  createUpgradeRequiredResponse,
  EMPTY_STRING,
  getClientId,
  getPathId,
  ifNotUndefined,
  objValues
} from "./utils.ts";
import type {Id} from "tinybase";
import {
  createDurableObjectSqlStoragePersister,
  type DurableObjectSqlStoragePersister
} from "tinybase/persisters/persister-durable-object-sql-storage";

const SERVER_CLIENT_ID = 'S';

export abstract class TinybaseDO extends WsServerDurableObject<Env> {
  protected store?: MergeableStore;
  protected persister?: DurableObjectSqlStoragePersister // DurableObjectStoragePersister

  protected constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      await this.addDOToTable()
    });
  }

  protected abstract namespace(): string;

  protected isFetchAllowed(request: Request) {
    return true
  }

  protected log(...optionalParams: any[]) {
    console.log(this.namespace(), ...optionalParams);
  }

  protected error(...optionalParams: any[]) {
    console.error(this.namespace(), ...optionalParams);
  }

  private async addDOToTable(): Promise<void> {
    this.log(this.namespace(), 'addDOToTable')
    try {
      const db = drizzle(this.env.DB)
      await db.insert(durableObjectsTable)
        .values({
          namespace: this.namespace(),
          id: this.ctx.id.name!.toString()
        }).onConflictDoNothing()
    } catch (e) {
      this.error(e);
    }
  }


  createPersister() {
    if (this.persister) {
      return this.persister;
    }
    const config = {
      mode: 'fragmented',
      storagePrefix: 'my_app_',
    };
    this.log('createPersister', 'Creating store and persister');
    this.store = createMergeableStore()
    this.persister = createDurableObjectSqlStoragePersister(
      this.store,
      this.ctx.storage.sql,
      'fragmented',
      (sql, a) => {
        console.log('TinybaseDO', 'onSqlCommand', sql);
      },
      (e) => {
        console.error('TinybaseDO', e);
      }
    )
    /*
    this.persister = createDurableObjectStoragePersister(
      this.store,
      this.ctx.storage,
    );*/
    return this.persister;
  }

  #getClients(tag?: Id) {
    return this.ctx.getWebSockets(tag);
  }

  protected defaultFetch(request: Request): Response | Promise<Response> {
    const pathId = getPathId(request);
    return ifNotUndefined(
      getClientId(request),
      (clientId) => {
        const [webSocket, client] = objValues(new WebSocketPair());
        if (arrayIsEmpty(this.#getClients())) {
          this.onPathId(pathId, 1);
        }
        this.ctx.acceptWebSocket(client, [clientId, pathId]);
        this.onClientId(pathId, clientId, 1);
        client.send(createPayload(SERVER_CLIENT_ID, null, 1, EMPTY_STRING));
        return createResponse(101, webSocket);
      },
      createUpgradeRequiredResponse,
    ) as Response;
  }


}
