import { For, JSX, type VoidComponent } from 'solid-js'
import { interleaveComponents } from './interleave'
import '../../../overlay/marquee.css'

export const Ticker: VoidComponent<{
  header: JSX.Element[]
  items: JSX.Element[]
}> = (props) => {
  const items = () => props.items
  const headers = () => props.header

  /**
   * Build interwoven marquee items similar to CharitiesOverlay: return bare nodes, wrapper is applied in the marquee render
   * Distributes headers as evenly as possible among items.
   */
  const finalDisplayItems = () => interleaveComponents(items(), headers())

  const duration = () => {
    return 4 * items().length * 2
  }

  return (
    <>
      <p class="text-black">
        duration:{duration()}, items:{props.items.length}, headers:
        {props.header.length}, final: {finalDisplayItems().length}
      </p>
      <div class="relative flex overflow-x-hidden">
        <div
          style={{
            animation: `marquee ${duration()}s linear infinite`,
          }}
          class="relative z-10 flex flex-row whitespace-nowrap"
        >
          <For each={finalDisplayItems()}>
            {(d, i) => {
              const color = i() % 2 === 0 ? 'bg-primary' : 'bg-accent'
              return (
                <div
                  class={`inline-block h-[80px] w-[256px] items-center justify-center px-2 py-1 ${color}`}
                >
                  <p>m</p> {d}
                </div>
              )
            }}
          </For>
        </div>
        <div
          style={{
            animation: `marquee2 ${duration()}s linear infinite`,
          }}
          class="absolute top-0 z-0 flex flex-row whitespace-nowrap"
        >
          <For each={finalDisplayItems()}>
            {(d, i) => {
              const color = i() % 2 === 0 ? 'bg-primary' : 'bg-accent'
              return (
                <div
                  class={`inline-block h-[80px] w-[256px] items-center justify-center px-2 py-1 ${color}`}
                >
                  <p>m2</p> {d}
                </div>
              )
            }}
          </For>
        </div>
      </div>
    </>
  )
}
