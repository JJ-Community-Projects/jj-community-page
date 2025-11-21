import { oc } from '@orpc/contract'
import { z } from 'zod/v4'
import { JJCampaignSchema } from '../../public/twitchExtension/contract.ts'

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

// Clear JJ DO storage
const clearJingleJamDataContract = oc.input(z.void()).output(z.void())

// New admin procedures for Twitch/channel data

// New admin procedures for Twitch/channel data
const getAllTwitchChannelsContract = oc.output(z.array(z.string()))
const getAllYoutubeChannelsContract = oc.output(z.array(z.string()))
const getAllLiveChannelsContract = oc.output(z.array(z.string()))
const validateTwitchChannelsContract = oc.input(z.void()).output(z.void())
const checkLiveStreamsContract = oc.input(z.void()).output(z.void())

// Invalid Twitch channels admin contracts
const getInvalidTwitchChannelsContract = oc.output(z.array(z.string()))
const clearInvalidTwitchChannelsContract = oc.input(z.void()).output(z.void())

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

// Schedules admin contract: list all schedules with owner name
const scheduleListItemSchema = z.object({
  scheduleId: z.number(),
  year: z.number(),
  visible: z.boolean(),
  primary: z.boolean(),
  ownerId: z.number(),
  ownerName: z.string().nullable().default('')
})

export type AdminScheduleListItem = z.infer<typeof scheduleListItemSchema>

const getAllSchedulesContract = oc.output(z.array(scheduleListItemSchema))

// Schedule export/import
const exportScheduleContract = oc
  .input(z.object({ scheduleId: z.number().int().positive() }))
  .output(z.string())

const importScheduleContract = oc
  .input(z.object({ json: z.string() }))
  .output(z.object({ scheduleId: z.number().int().positive() }))

// --- Scheduler/task admin contracts ---
const schedulerTaskSchema = z.object({
  name: z.string(),
  everyMs: z.number(),
  enabled: z.boolean(),
  lastRunMs: z.number().nullable(),
  nextDueAtMs: z.number(),
  dueNow: z.boolean(),
})

export type SchedulerTask = z.infer<typeof schedulerTaskSchema>

const getSchedulerTasksStatusContract = oc.output(
  z.array(schedulerTaskSchema),
)

const setTaskEnabledContract = oc
  .input(z.object({ name: z.string(), enabled: z.boolean() }))
  .output(z.void())

const runSchedulerTaskContract = oc
  .input(z.object({ name: z.string() }))
  .output(z.void())

const runOverdueTasksNowContract = oc.input(z.void()).output(z.void())

// --- Campaigns (admin) ---
// Return the exact data shape from DO: getCommunityCampaignsDisplayAll
const getAllCampaignsContract = oc.output(
  z.object({
    count: z.number(),
    list: z.array(
      JJCampaignSchema.pick({
        tiltifySlug: true,
        campaignName: true,
        tiltifyName: true,
        tiltifyUrl: true,
        avatar: true,
        twitch: true,
      }),
    ),
  }),
)

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
  // new exports
  clearJingleJamDataContract,
  getAllTwitchChannelsContract,
  getAllYoutubeChannelsContract,
  getAllLiveChannelsContract,
  validateTwitchChannelsContract,
  checkLiveStreamsContract,
  getTwitchStreamsContract,
  getGBPToEURRateContract,
  syncTwitchChannelsFromSocialsContract,
  getInvalidTwitchChannelsContract,
  clearInvalidTwitchChannelsContract,
  // schedules
  getAllSchedulesContract,
  exportScheduleContract,
  importScheduleContract,
  // scheduler tasks
  getSchedulerTasksStatusContract,
  setTaskEnabledContract,
  runSchedulerTaskContract,
  runOverdueTasksNowContract,
  // campaigns
  getAllCampaignsContract,
}
