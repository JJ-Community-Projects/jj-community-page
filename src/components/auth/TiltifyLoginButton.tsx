import {type Component} from "solid-js";
import {TiltifyIcon} from "../common/JJIcons";

export const TiltifyLoginButton: Component = () => {
  return (
    <a
      href={'/api/auth/tiltify'}
      class="flex items-center justify-center gap-2 bg-tiltify hover:bg-tiltify/90 text-white font-medium py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-md"
    >
      <TiltifyIcon class="size-5" />
      <span>Login with Tiltify</span>
    </a>
  );
}
