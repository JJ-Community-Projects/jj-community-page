import { type Component, createSignal, Match, onCleanup, Switch } from 'solid-js'
import { QueryClientProvider, useMutation } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { PageHeader } from '../../../../ui/PageHeader'
import { Button } from '../../../../ui/Button'
import { Tile } from '../../../../ui/Tile'
import { Alert } from '../../../../ui/Status'
import { SPIN_MS } from '../../../overlay/wheel/wheel.ts'

type Outcome =
  | { kind: 'spinning'; listeners: number }
  | { kind: 'done'; listeners: number }
  | { kind: 'none' }
  | { kind: 'busy' }
  | { kind: 'error' }

const overlays = (n: number) => (n === 1 ? '1 overlay' : `${n} overlays`)

const Content: Component = () => {
  const [outcome, setOutcome] = createSignal<Outcome | undefined>()
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))

  const spin = useMutation(() =>
    orpcPrivate.wheelWS.spin.mutationOptions({
      onSuccess: ({ spun, listeners }) => {
        clearTimeout(timer)
        if (!spun) return setOutcome({ kind: 'busy' })
        if (listeners === 0) return setOutcome({ kind: 'none' })
        setOutcome({ kind: 'spinning', listeners })
        timer = setTimeout(() => setOutcome({ kind: 'done', listeners }), SPIN_MS)
      },
      onError: () => setOutcome({ kind: 'error' }),
    }),
  )

  const listeners = () => {
    const o = outcome()
    return o && 'listeners' in o ? o.listeners : 0
  }
  const disabled = () => spin.isPending || outcome()?.kind === 'spinning'

  return (
    <div class="flex flex-col gap-3">
      <PageHeader
        title="The Wheel"
        subtitle="Spin the wheel on your stream"
        back={{ href: '/dashboard', label: 'Dashboard' }}
        align="start"
      />
      <Tile class="flex flex-col items-center gap-5 py-10 text-center">
        <Button
          variant="primary"
          class="h-20 rounded-full px-16 text-2xl"
          disabled={disabled()}
          onClick={() => spin.mutate(undefined)}
        >
          {outcome()?.kind === 'spinning' ? 'Spinning…' : 'Spin'}
        </Button>
        <div aria-live="polite" class="flex w-full max-w-prose flex-col items-center">
          <Switch
            fallback={
              <p class="text-fg-muted text-sm">
                Every OBS source with your wheel link spins and lands on the same item.
              </p>
            }
          >
            <Match when={outcome()?.kind === 'spinning'}>
              <p class="text-fg-muted text-sm">Spinning on {overlays(listeners())}…</p>
            </Match>
            <Match when={outcome()?.kind === 'done'}>
              <p class="text-fg-muted text-sm">
                Spun on {overlays(listeners())}. Ready for the next spin.
              </p>
            </Match>
            <Match when={outcome()?.kind === 'busy'}>
              <p class="text-fg-muted text-sm">
                The wheel is still spinning. Try again in a moment.
              </p>
            </Match>
            <Match when={outcome()?.kind === 'none'}>
              <Alert tone="warning" class="text-left">
                No wheel overlay is connected. Add the wheel's link as a browser source in OBS and
                keep the source active (OBS unloads a hidden source when "Shutdown source when not
                visible" is ticked).
              </Alert>
            </Match>
            <Match when={outcome()?.kind === 'error'}>
              <Alert tone="danger" class="text-left">The spin didn't go through. Try again.</Alert>
            </Match>
          </Switch>
        </div>
      </Tile>
      <Tile class="flex flex-col items-start gap-2">
        <h2 class="text-base font-semibold">Set up the wheel</h2>
        <p class="text-fg-muted text-sm">
          Choose the items and colours on the overlays page, under "The Wheel", and copy its link
          into an OBS browser source (600×600).
        </p>
        <Button href="/overlays" size="sm">
          Open the overlays page
        </Button>
      </Tile>
    </div>
  )
}

export const WheelSpinPage: Component = () => (
  <QueryClientProvider client={new QueryClient()}>
    <Content />
  </QueryClientProvider>
)
