import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

const refreshJJAPIDataContract = oc.output(z.void())

const addStringConfigContract = oc
  .input(z.object({ key: z.string(), value: z.string() }))
  .output(z.void())

const addNumberConfigContract = oc
  .input(z.object({ key: z.string(), value: z.number() }))
  .output(z.void())

const addBooleanConfigContract = oc
  .input(z.object({ key: z.string(), value: z.boolean() }))
  .output(z.void())

const removeConfigContract = oc
  .input(z.object({ key: z.string() }))
  .output(z.void())

const ConfigSchema = z.union([
  z.object({
    key: z.string(),
    type: z.literal('string'),
    value: z.string(),
  }),
  z.object({
    key: z.string(),
    type: z.literal('number'),
    value: z.number(),
  }),
  z.object({
    key: z.string(),
    type: z.literal('boolean'),
    value: z.boolean(),
  }),
])

export type Config = z.infer<typeof ConfigSchema>

const getAllConfigsContract = oc.output(z.array(ConfigSchema))

const getKVValueContract = oc
  .input(z.object({ key: z.string() }))
  .output(z.object({ key: z.string(), value: z.string() }))

const getAllKVKeysContract = oc.output(z.array(z.string()))

const putKVValueContract = oc
  .input(z.object({ key: z.string(), value: z.string() }))
  .output(z.void())

const deleteKVValueContract = oc
  .input(z.object({ key: z.string() }))
  .output(z.void())

const triggerTwitchLiveCheckContract = oc.input(z.void()).output(z.void())

const twitchStreamListItemSchema = z.object({
  userLogin: z.string(),
  displayName: z.string().optional(),
  title: z.string().nullable().optional(),
  isLive: z.boolean(),
  url: z.string(),
})

export type AdminTwitchStreamListItem = z.infer<typeof twitchStreamListItemSchema>

const getTwitchStreamsContract = oc.output(z.array(twitchStreamListItemSchema))

const getGBPToEURRateContract = oc.output(z.number())

const syncTwitchChannelsFromSocialsContract = oc.input(z.void()).output(z.void())

export const contracts = {
  refreshJJAPIDataContract,
  addStringConfigContract,
  addNumberConfigContract,
  addBooleanConfigContract,
  removeConfigContract,
  getAllConfigsContract,
  getKVValueContract,
  getAllKVKeysContract,
  putKVValueContract,
  deleteKVValueContract,
  triggerTwitchLiveCheckContract,
  getTwitchStreamsContract,
  getGBPToEURRateContract,
  syncTwitchChannelsFromSocialsContract,
}
