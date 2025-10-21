import { contracts } from './contract.ts'
import { implement, ORPCError } from '@orpc/server'
import { adminAuthMiddleware } from '../../middleware/authAdminMiddleware.ts'

const os = implement(contracts).use(adminAuthMiddleware)

const refreshJJAPIData = os.refreshJJAPIDataContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      await stub.refresh()
    } catch (e: any) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: e?.message ?? 'Failed to refresh',
      })
    }
  },
)

const addStringConfig = os.addStringConfigContract.handler(
  async ({ input, context }) => {
    const DO = context.env.ConfigDO
    const stubId = DO.idFromName('ConfigDO')
    const stub = DO.get(stubId)
    await stub.setStringConfig(input.key, input.value)
  },
)

const addNumberConfig = os.addNumberConfigContract.handler(
  async ({ input, context }) => {
    const DO = context.env.ConfigDO
    const stubId = DO.idFromName('ConfigDO')
    const stub = DO.get(stubId)
    await stub.setNumberConfig(input.key, input.value)
  },
)

const addBooleanConfig = os.addBooleanConfigContract.handler(
  async ({ input, context }) => {
    const DO = context.env.ConfigDO
    const stubId = DO.idFromName('ConfigDO')
    const stub = DO.get(stubId)
    await stub.setBooleanConfig(input.key, input.value)
  },
)

const removeConfigContract = os.removeConfigContract.handler(
  async ({ input, context }) => {
    const DO = context.env.ConfigDO
    const stubId = DO.idFromName('ConfigDO')
    const stub = DO.get(stubId)
    await stub.deleteConfig(input.key)
  },
)

const getAllConfigs = os.getAllConfigsContract.handler(async ({ context }) => {
  const DO = context.env.ConfigDO
  const stubId = DO.idFromName('ConfigDO')
  const stub = DO.get(stubId)
  const map = await stub.getAllConfig()
  return map
    .keys()
    .toArray()
    .map((key) => {
      const v = map.get(key)!
      switch (v.type) {
        case 'string':
          return {
            key: key,
            type: 'string',
            value: v.value as string,
          }
        case 'number':
          return {
            key: key,
            type: 'number',
            value: v.value as number,
          }
        case 'boolean':
          return {
            key: key,
            type: 'boolean',
            value: v.value as boolean,
          }
      }
    })
})

const getKVValue = os.getKVValueContract.handler(async ({ context, input }) => {
  const { key } = input
  const KV = context.env.KV
  const value = await KV.get(key)
  if (value === null) {
    throw new ORPCError('NOT_FOUND', {
      message: `Value for key: ${key} not found`,
    })
  }
  return {
    key,
    value,
  }
})

const getAllKVKeys = os.getAllKVKeysContract
  .handler(async ({ context }) => {
    const KV = context.env.KV
    const result = await KV.list()
    const keys = result.keys
    return keys.map(k => k.name)
  })

const putKVValue = os.putKVValueContract.handler(async ({ context, input }) => {
  const { key, value } = input
  const KV = context.env.KV
  await KV.put(key, value)
})

const deleteKVValue = os.deleteKVValueContract.handler(
  async ({ context, input }) => {
    const { key } = input
    const KV = context.env.KV
    await KV.delete(key)
  },
)

export const adminRouter = {
  refreshJJAPIData,
  addStringConfig,
  addNumberConfig,
  addBooleanConfig,
  removeConfigContract,
  getAllConfigs,
  getKVValue,
  getAllKVKeys,
  putKVValue,
  deleteKVValue,
}
