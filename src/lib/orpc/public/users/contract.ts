import {oc} from '@orpc/contract'
import {
  TwitchChannelSchema,
  UserDisplaySchema,
  UserIdSchema,
  UserPaginationSchema,
  UserProfileDataSchema,
  UserSlugSchema
} from "../schemas/users.ts";


export const getUserBySlugContract = oc.input(UserSlugSchema)
  .output(UserDisplaySchema)

export const getUserProfileBySlugContract = oc.input(UserSlugSchema)
  .output(UserProfileDataSchema)

export const getAllUsersPagedContract = oc.input(UserPaginationSchema)
  .output(UserDisplaySchema.array())

export const getAllUsersContract = oc
  .output(UserDisplaySchema.array())

export const getTwitchChannelByUserIdContract = oc.input(UserIdSchema)
  .output(TwitchChannelSchema.nullable())

export const getTwitchChannelByUserSlugContract = oc.input(UserSlugSchema)
  .output(TwitchChannelSchema.nullable())

export const usersContracts = {
  getUserBySlugContract,
  getUserProfileBySlugContract,
  getAllUsersPagedContract,
  getAllUsersContract,
  getTwitchChannelByUserIdContract,
  getTwitchChannelByUserSlugContract
}
