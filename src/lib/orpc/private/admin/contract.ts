import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

const refreshJJAPIDataContract = oc.output(z.void())

export const contracts = {
  refreshJJAPIDataContract,
}
