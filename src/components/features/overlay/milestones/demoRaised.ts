import { onCleanup } from 'solid-js'

// The configurator's test amount reaches the preview iframe without reloading it,
// so reached milestones and the goal bar animate as the amount changes.
const CHANNEL = 'overlay-milestones-demo-raised'

const open = () =>
  typeof BroadcastChannel === 'undefined'
    ? undefined
    : new BroadcastChannel(CHANNEL)

export function createDemoRaisedSender() {
  const channel = open()
  onCleanup(() => channel?.close())
  return (raised: number) => channel?.postMessage({ raised })
}

export function listenDemoRaised(onRaised: (raised: number) => void) {
  const channel = open()
  if (!channel) return
  channel.onmessage = (e: MessageEvent) => {
    const raised = (e.data as { raised?: unknown } | null)?.raised
    if (typeof raised === 'number' && Number.isFinite(raised) && raised >= 0)
      onRaised(raised)
  }
  onCleanup(() => channel.close())
}
