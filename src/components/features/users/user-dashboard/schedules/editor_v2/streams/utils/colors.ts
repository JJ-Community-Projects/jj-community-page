import { DateTime } from 'luxon'
import { getStreamColor } from '../../../../../../../../functions/jjDatesToColors.ts'

/** The day's colour from the one runtime palette (JJColors), as the public schedule rows use it. */
export const getDayColor = (date: Date) => getStreamColor(DateTime.fromJSDate(date))
