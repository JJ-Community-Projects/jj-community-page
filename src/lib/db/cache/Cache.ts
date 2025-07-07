import type {KVNamespacePutOptions} from "@cloudflare/workers-types/2021-11-03/index.ts";


export abstract class Cache<T> {
  kv: KVNamespace

  constructor(env: Env) {
    this.kv = env.KV
  }

  putStr(key: string, value: string, options?: KVNamespacePutOptions) {
    return this.kv.put(key, value, options)
  }

  getStr(key: string, cacheTtl?: number) {
    return this.kv.get(key, {
      type: 'text',
      cacheTtl
    })
  }

  put(key: string, value: T, options?: KVNamespacePutOptions) {
    return this.kv.put(key, JSON.stringify(value), options)
  }

  get(key: string, cacheTtl?: number) {
    return this.kv.get<T>(key, {
      type: 'json',
      cacheTtl
    })
  }

  delete(key: string) {
    return this.kv.delete(key)
  }


}
