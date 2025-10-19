import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

const refreshJJAPIDataContract = oc.output(z.void())

const addStringConfigContract = oc.input(z.object({key: z.string(), value: z.string()})).output(z.void())

const addNumberConfigContract = oc.input(z.object({key: z.string(), value: z.number()})).output(z.void())

const addBooleanConfigContract = oc.input(z.object({key: z.string(), value: z.boolean()})).output(z.void())

const removeConfigContract = oc.input(z.object({key: z.string()})).output(z.void())

const ConfigSchema =  z.union([
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
  })
])

export type Config = z.infer<typeof ConfigSchema>

const getAllConfigsContract = oc.output(
  z.array(ConfigSchema)
)

export const contracts = {
  refreshJJAPIDataContract,
  addStringConfigContract,
  addNumberConfigContract,
  addBooleanConfigContract,
  removeConfigContract,
  getAllConfigsContract
}
