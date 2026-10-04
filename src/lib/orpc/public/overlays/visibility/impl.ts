import { implement } from '@orpc/server'
import { contracts } from './contract.ts'
import { hasAstroContext } from '../../../middleware/hasAstroContext.ts'
import { readContentVisibility } from '../../../../services/overlayVisibility.ts'

const os = implement(contracts).use(hasAstroContext)

const getHidden = os.getHiddenContract.handler(async ({ context }) => {
  return (await readContentVisibility(context.env)) === 'hidden'
})

export const overlaysVisibilityRouter = {
  getHidden,
}
