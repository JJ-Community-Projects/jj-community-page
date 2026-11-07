import { implement } from '@orpc/server'
import { contracts } from './contract.ts'
import { hasAstroContext } from '../../../middleware/hasAstroContext.ts'
import { readContentVisibilityCached } from '../../../../services/overlayVisibility.ts'

const os = implement(contracts).use(hasAstroContext)

const getHidden = os.getHiddenContract.handler(async ({ context }) => {
  return (await readContentVisibilityCached(context.env)) === 'hidden'
})

export const overlaysVisibilityRouter = {
  getHidden,
}
