import { DurableObject } from 'cloudflare:workers'

type Config = {
  type: 'string',
  value: string
} | {
  type: 'boolean',
  value: boolean
} | {
  type: 'number',
  value: number
}

export class ConfigDO extends DurableObject<Env> {
  private get storage() {
    return this.ctx.storage
  }

  public setStringConfig(key: string, value: string) {
    return this.storage.put(key, {
      type: 'string',
      value: value,
    })
  }

  public async getStringConfig(key: string) {
    const value = await this.storage.get<{
      type: 'string'
      value: string
    }>(key)
    return value?.value
  }

  public setBooleanConfig(key: string, value: boolean) {
    return this.storage.put(key, {
      type: 'boolean',
      value: value,
    })
  }

  public async getBooleanConfig(key: string) {
    const value = await this.storage.get<{
      type: 'boolean'
      value: boolean
    }>(key)
    return value?.value
  }

  public setNumberConfig(key: string, value: number) {
    return this.storage.put(key, {
      type: 'number',
      value: value,
    })
  }

  public async getNumberConfig(key: string) {
    const value = await this.storage.get<{
      type: 'number'
      value: number
    }>(key)
    return value?.value
  }

  public async deleteConfig(key: string) {
    return this.storage.delete(key)
  }

  public async getAllConfig() {
    return this.storage.list<Config>()
  }
}
