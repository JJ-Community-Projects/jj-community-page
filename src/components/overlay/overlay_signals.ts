export const useParam = (key: string) => {
  // const [params] = useSearchParams()
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get(key)
  // return undefined // location.query[key]
}

export const useHeader = () => {
  return (useParam('header') ?? 'upnext').split(',')
}

export const useCauses = () => {
  const c = useParam('causes')
  if (!c) {
    return undefined
  }
  if (c === '') {
    return undefined
  }
  return c!.split(',')
}
export const background = () => {
  // @ts-ignore
  return ('#' + useParam('background')) ?? 'ff000000'
}
export const excludedChannel = () => {
  return (useParam('exclude') ?? '').split(',')
}
export const minAmount = () => {
  return parseInt(useParam('minamount') ?? '0')
}
export const useSpeed = () => {
  return parseInt(useParam('speed') ?? '2') ?? 2
}
export const useShowTimezone = () => {
  return (useParam('showtimezone') ?? 'true') === 'true'
}
export const useTimezone = () => {
  return useParam('timezone')
}
export const useTiltifyUrl = () => {
  return useParam('tiltifyurl') ?? 'jinglejam.tiltify.com'
}
export const useTheme = () => {
  return useParam('theme') ?? 'default'
}
export const useHeaderTheme = () => {
  return useParam('headertheme') ?? 'default'
}
export const useShowRaised = () => {
  return (useParam('showraised') ?? 'true') === 'true'
}
export const useShowCharityDesc = () => {
  return (useParam('showcharitydesc') ?? 'true') === 'true'
}
export const useShowCharityQRCode = () => {
  return (useParam('showcharityqrcode') ?? 'true') === 'true'
}
export const useShowCharityUrl = () => {
  return (useParam('showcharityurl') ?? 'true') === 'true'
}

export const useSimpleScheduleData = () => {
  const scheduleData = useParam('scheduledata') ?? ''
  return window.atob(scheduleData)
}

export const useTitleLogo = () => {
  return useParam('titlelogo') ?? 'none'
}

export const useNext = () => {
  const v = parseInt(useParam('next') ?? '3') ?? 3
  if (v < 2) {
    return 2
  } else if (v > 4) {
    return 4
  }
  if (isNaN(v)) {
    return 3
  }
  return v
}
