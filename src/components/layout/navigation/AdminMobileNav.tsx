import {type Component, createEffect, createSignal} from "solid-js";
import {FaSolidBars, FaSolidXmark} from "solid-icons/fa";
import type {User} from "../../../lib/auth/User.ts";

interface MobileNavProps {
  user: User
}

export const AdminMobileNav: Component<MobileNavProps> = (props) => {
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
        Admin Menu {!open() ? <FaSolidBars class={'ml-2'}/> : <FaSolidXmark class={'ml-2'}/>}
      </button>
      <div class={'mt-1 flex flex-col space-y-1 transition-all md:hidden text-white bg-accent p-2 rounded-2xl gap-2'}
           ref={setRef}>
        <a href={`/dashboard`}>My Dashboard</a>
        <a href="/overlays">Stream Overlays</a>
        <a href="/twitch-extension">Twitch Extension</a>
      </div>
    </div>
  );
}
