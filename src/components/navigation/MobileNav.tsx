import {type Component, createEffect, createSignal, For, Show} from "solid-js";
import {CgClose, CgMenu} from "solid-icons/cg";
import {useIsJJ} from "../../lib/utils/jjDates.ts";

interface MobileNavProps {
  yogsPaths: string[]
}

export const MobileNav: Component<MobileNavProps> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [ref, setRef] = createSignal<HTMLDivElement>()

  const isJJ = useIsJJ()

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
        <a href="/yogs/stats">Statistics</a>
        <a href="/overlays">Stream Overlays</a>
        <a href="/twitch-extension">Twitch Extension</a>
        <a href="/faq">FAQ</a>
        <Show when={isJJ()}>
          <a
            class="flex flex-row gap-2 items-center"
            href="http://jinglejam.tiltify.com"
            target="_blank"
          >
            Donate <svg
            viewBox="0 0 1080 1080"
            width="1em"
            height="1em"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="m5085 9379c-694-59-1321-275-1890-652-891-590-1502-1503-1714-2562-54-268-65-400-65-765-1-365 10-494 65-765 162-806 549-1523 1131-2091 639-624 1441-1004 2343-1111 210-24 680-24 890 0 902 107 1704 487 2343 1111 583 569 972 1290 1132 2095 54 275 64 396 64 761s-10 486-64 761c-294 1482-1372 2658-2824 3079-223 64-524 117-799 139-147 13-465 12-612 0zm2292-1329c169-39 318-192 355-363 6-28 8-92 6-143-4-75-11-104-36-158-36-76-114-164-189-212-60-39-177-74-247-74-122 0-252 55-341 145-71 70-110 144-131 247-16 75-17 97-6 160 18 110 68 203 149 278 63 60 154 112 213 123 47 8 185 7 227-3zm-3277-279c47-10 108-26 135-34 28-8 88-26 135-40s159-48 250-75c91-28 181-54 200-60 19-5 109-32 200-60 91-27 181-54 200-60 19-5 109-32 200-60 91-27 181-54 200-60 19-5 109-32 200-60 91-27 181-54 200-60 31-9 228-68 455-137 87-26 271-81 405-121 339-102 457-156 574-265 130-122 183-263 159-428-28-187-123-306-303-376-146-57-313-57-675 0-126 20-270 43-320 50-49 8-145 22-212 33-68 10-125 17-128 14s-5-609-5-1346c0-1462 2-1406-58-1538-76-167-210-288-392-355-68-25-87-27-215-27-122 0-149 3-205 23-211 76-358 228-434 446-20 59-21 76-26 1535l-5 1474-40 7c-22 4-116 19-210 34-93 14-210 32-260 40-49 8-162 26-250 40-202 32-275 57-402 138-98 62-229 228-273 344-86 228-55 491 82 691 100 145 280 266 460 307 81 18 243 12 358-14z"
              transform="matrix(.1 0 0 -.1 0 1080)"
              fill="white"/>
          </svg>
          </a>
        </Show>
      </div>
    </div>
  );
}
