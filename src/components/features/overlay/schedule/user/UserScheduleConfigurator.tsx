import { type Component, createMemo, createSignal } from 'solid-js'
import {
  buildUrl,
  ConfiguratorBody,
  titleCase,
} from '../../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../../overview/formats.ts'
import { useUser } from '../../../users/user-dashboard/providers/UserProvider.tsx'
import { Select } from '../../../../ui/Select'

type Theme = 'default' | 'red' | 'blue'
type StreamStyle = 'filled' | 'striped'

const LIMITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

export const UserScheduleConfigurator: Component = () => {
  const [theme, setTheme] = createSignal<Theme>('default')
  const [streamStyle, setStreamStyle] = createSignal<StreamStyle>('filled')
  const [limit, setLimit] = createSignal<number>(4)
  const { user } = useUser()
  const scheduleUrl = createMemo(() =>
    buildUrl('/overlays/schedule', {
      user: user?.tiltifySlug,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      theme: theme(),
      style: streamStyle(),
      limit: limit(),
    }),
  )

  return (
    <ConfiguratorBody
      description="Your upcoming streams from your primary schedule in a compact panel, as slot rows like in the Twitch extension. Choose a theme, a filled or striped header, and how many streams to show."
      format={OVERLAY_FORMATS.schedule}
      previewUrl={scheduleUrl()}
      linkUrl={scheduleUrl()}
    >
      <Select
        label="Theme"
        showLabel
        options={['default', 'red', 'blue'] as Theme[]}
        value={theme()}
        onChange={setTheme}
        format={titleCase}
      />
      <Select
        label="Header style"
        showLabel
        options={['filled', 'striped'] as StreamStyle[]}
        value={streamStyle()}
        onChange={setStreamStyle}
        format={(v) => (v === 'filled' ? 'Filled' : 'Striped')}
      />
      <Select
        label="Streams shown"
        showLabel
        options={LIMITS}
        value={String(limit())}
        onChange={(v) => setLimit(Number(v))}
        format={(v) => v}
      />
    </ConfiguratorBody>
  )
}
