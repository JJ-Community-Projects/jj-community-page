import { type Component, createMemo, createSignal } from 'solid-js'
import { buildUrl, FieldRow, LinkPreview, PreviewFrame } from './Common'
import { useUser } from '../../users/user-dashboard/providers/UserProvider.tsx'

export const CharitiesSection: Component<{ visible?: boolean }> = (p) => {
  const [showRaised, setShowRaised] = createSignal<boolean>(true)
  const [showTitle, setShowTitle] = createSignal<boolean>(true)
  const [showJJLink, setShowJJLink] = createSignal<boolean>(true)
  const [theme, setTheme] = createSignal<string>('default')

  const { user } = useUser()

  const charitiesUrl = createMemo(() =>
    buildUrl('/overlays-v2/charities', {
      showraised: showRaised(),
      showtitle: showTitle(),
      showjjlink: showJJLink(),
      theme: theme(),
      user: user.tiltifyName,
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <FieldRow label="Show Raised">
        <input
          type="checkbox"
          checked={showRaised()}
          onChange={(e) => setShowRaised(e.currentTarget.checked)}
        />
      </FieldRow>
      <FieldRow label="Show Title">
        <input
          type="checkbox"
          checked={showTitle()}
          onChange={(e) => setShowTitle(e.currentTarget.checked)}
        />
      </FieldRow>
      <FieldRow label="Show JJ Link">
        <input
          type="checkbox"
          checked={showJJLink()}
          onChange={(e) => setShowJJLink(e.currentTarget.checked)}
        />
      </FieldRow>
      <FieldRow label="Theme">
        <select
          value={theme()}
          onChange={(e) => setTheme(e.currentTarget.value)}
          class="w-40 rounded bg-black/40 px-2 py-1"
        >
          <option value="default">Default</option>
          <option value="red">Red</option>
          <option value="blue">Blue</option>
        </select>
      </FieldRow>
      <LinkPreview url={charitiesUrl()} />
      <PreviewFrame url={charitiesUrl()} visible={p.visible} />
    </div>
  )
}

export default CharitiesSection
