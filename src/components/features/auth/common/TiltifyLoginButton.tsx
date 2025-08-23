import {type Component} from "solid-js";
import {TiltifyIcon} from "../../../common/icons/JJIcons";

export const TiltifyLoginButton: Component = () => {
  return (
    <a
      href={'/api/auth/tiltify'}
      class="flex items-center justify-center gap-3 bg-tiltify hover:bg-tiltify/90 disabled:bg-tiltify/50 text-white font-semibold font-poppins py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:pointer-events-none w-full group"
    >
      <TiltifyIcon class={`size-5 group-hover:rotate-3 transition-transform`} />
      <span>Login with Tiltify</span>
    </a>
  );
}
