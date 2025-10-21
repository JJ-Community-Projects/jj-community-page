import type { Component, JSX } from "solid-js";
import { TiltifyIcon } from "../../../common/icons/JJIcons";

type Props = {
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
};

export const TiltifyLoginButton: Component<Props> = (props) => {
  const label = () => props.label ?? "Login with Tiltify";
  const href = "/api/auth/tiltify";

  const handleClick: JSX.EventHandler<HTMLAnchorElement, MouseEvent> = (e) => {
    if (props.disabled) {
      e.preventDefault();
      return;
    }
    if (props.onClick) {
      e.preventDefault();
      props.onClick();
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      class="flex items-center justify-center gap-3 bg-tiltify hover:bg-tiltify/90 disabled:bg-tiltify/50 text-white font-semibold font-poppins py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:pointer-events-none w-full group"
      aria-disabled={props.disabled ? "true" : "false"}
    >
      <TiltifyIcon class={`size-5 group-hover:rotate-3 transition-transform`} />
      <span>{label()}</span>
    </a>
  );
};
