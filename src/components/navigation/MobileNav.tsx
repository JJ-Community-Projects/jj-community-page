import {type Component, createEffect, createSignal, For} from "solid-js";
import {CgClose, CgMenu} from "solid-icons/cg";

interface MobileNavProps {
  yogsPaths: string[]
}

export const MobileNav: Component<MobileNavProps> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [ref, setRef] = createSignal<HTMLDivElement>()

  createEffect(() => {
    if (open()) {
      ref()?.classList.remove('hidden')
      ref()?.classList.add('flex')
    } else {
      ref()?.classList.add('hidden')
      ref()?.classList.remove('flex')
    }
  })

  const onClick = () => {
    setOpen(!open())
  }

  return (
    <div class={'md:hidden flex flex-col items-center justify-center'}>
      <button class={'text-text flex flex-row items-center rounded-xl bg-white p-4'} onClick={onClick}>
        Menu {!open() ? <CgMenu class={'ml-2'}/> : <CgClose class={'ml-2'}/>}
      </button>
      <div class={'mt-1 flex flex-col space-y-1 transition-all md:hidden text-white bg-accent p-2 rounded-2xl gap-2'}
           ref={setRef}>
        <a href="/">Home</a>
        <a href="/community">Community</a>
        <div class="group relative">
          <a href="/yogs" class="flex w-full flex-row items-center rounded-lg bg-transparent focus:outline-none">
            <span>Yogs</span>
          </a>
        </div>
        <For each={props.yogsPaths}>
          {path => (
            <a class="nav" href={`/yogs/schedules/${path}`}>Yogs {path}</a>
          )}
        </For>
        <a href="/overlays">Stream Overlays</a>
        <a href="/twitch-extension">Twitch Extension</a>
        <a href="/faq">FAQ</a>
      </div>
    </div>
  );
}
