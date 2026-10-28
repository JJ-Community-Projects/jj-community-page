/** One entry of the site navigation; `children` open as a dropdown (desktop) or a sub-list (mobile). */
export type NavItem = {
  label: string
  href: string
  /** Opens in a new tab (Donate). */
  external?: boolean
  children?: NavItem[]
}

export const DONATE_URL = 'https://jinglejam.tiltify.com'

type MainNavOptions = {
  /** Years with a visible Yogscast schedule, newest first. */
  yogsYears: string[]
  loggedIn: boolean
  showDonate: boolean
}

export const mainNav = (options: MainNavOptions): NavItem[] => [
  { label: 'Home', href: '/' },
  {
    label: 'Community',
    href: '/community',
    children: [
      { label: 'Community', href: '/community' },
      { label: 'Schedule', href: '/community/schedule' },
      { label: 'Teams', href: '/teams' },
    ],
  },
  { label: 'Stream Resources', href: '/stream-resources' },
  {
    label: 'Yogs',
    href: '/yogs',
    children: [
      { label: 'Yogs', href: '/yogs' },
      ...options.yogsYears.map((year) => ({
        label: year,
        href: `/yogs/archive/${year}`,
      })),
      { label: 'Statistics', href: '/yogs/stats' },
    ],
  },
  { label: 'FAQ', href: '/faq' },
  options.loggedIn
    ? { label: 'Dashboard', href: '/dashboard' }
    : { label: 'Login', href: '/login' },
  ...(options.showDonate
    ? [{ label: 'Donate', href: DONATE_URL, external: true }]
    : []),
]

export const pwaNav = (yogsYears: string[]): NavItem[] => [
  { label: 'Home', href: '/pwa' },
  {
    label: 'Yogs',
    href: '/pwa/yogs',
    children: [
      { label: 'Yogs', href: '/pwa/yogs' },
      ...yogsYears.map((year) => ({
        label: year,
        href: `/pwa/yogs/schedules/${year}`,
      })),
    ],
  },
]

const matches = (href: string, path: string) =>
  path === href || path.startsWith(`${href}/`)

/**
 * The href of the current page: the longest internal href that equals the path or is a parent of
 * it, so `/teams/x` marks Teams and `/community/schedule` marks Schedule, not Community.
 */
export const currentHref = (items: NavItem[], path: string) => {
  // Prerendered pages are built as `<name>.html` and see that suffix in their pathname.
  const trimmed =
    path.length > 1 ? path.replace(/\.html$/, '').replace(/\/+$/, '') : path
  const hrefs = items
    .flatMap((item) => [item, ...(item.children ?? [])])
    .filter((item) => !item.external)
    .map((item) => item.href)
  return hrefs
    .filter((href) => (href === '/' ? trimmed === '/' : matches(href, trimmed)))
    .sort((a, b) => b.length - a.length)[0]
}

/** True for the current item and for a parent whose dropdown holds it. */
export const isActive = (item: NavItem, current: string | undefined) =>
  current !== undefined &&
  (item.href === current ||
    (item.children ?? []).some((child) => child.href === current))
