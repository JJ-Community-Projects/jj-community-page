import {type Component, Show} from "solid-js";
import type {UserDisplay} from "../../lib/orpc/public/schemas/UserDisplaySchema.ts";
import type {UserProfileData} from "../../lib/orpc/public/schemas/users.ts";
import {lightenColor} from "../../lib/utils/colorUtil.ts";
import {darkenColor} from "../../../colorUtil";
import {getTextColor} from "../../lib/utils/textColors.ts";

// Original UserAvatar interface for the default export
interface OriginalUserAvatarProps {
  user: UserProfileData;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

// New interface for the refactored components
interface UserAvatarProps {
  user: UserDisplay;
  primaryColor: string;
  accentColor: string;
}

// Original UserAvatar component (default export for backward compatibility)
const OriginalUserAvatar: Component<OriginalUserAvatarProps> = (props) => {
  const { user, size = 'lg' } = props;

  // Size mappings for different elements
  const sizeClasses = {
    xs: {
      container: "size-8",
      border: "border-2"
    },
    sm: {
      container: "size-12",
      border: "border-2"
    },
    md: {
      container: "size-16",
      border: "border-3"
    },
    lg: {
      container: "size-24",
      border: "border-4"
    }
  };

  return (
    <div class={"relative inline-block"}>
      {/* Avatar container */}
      <div class={`relative ${sizeClasses[size].container}`}>
        {/* Avatar image */}
        <div
          class={`relative rounded-full overflow-hidden ${sizeClasses[size].container} ${sizeClasses[size].border}`}
          style={{
            "border-color": user.style.accentColor ?? '#f00'
          }}
        >
          <img
            src={user.user.profileImage}
            alt={`${user.user.username}'s profile`}
            class="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export const UserAvatar: Component<UserAvatarProps> = (props) => {
  const {user} = props;

  const primaryColor = user.primaryColor ?? '#E30E50';
  const accentColor = user.accentColor ?? '#3584BF';

  const darkPrimaryColor = darkenColor(primaryColor, 0.2);

  const lightPrimary = lightenColor(primaryColor, 0.2);

  return (
    <a
      href={`/${user.tiltifySlug}`}
      class="group relative block rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden transform-gpu hover:brightness-105"
      style={{
        background: primaryColor, // `linear-gradient(135deg, ${darkPrimaryColor}, ${primaryColor}, ${lightPrimary})`,
      }}
    >
      {/* Card content */}
      <div class="p-3 flex flex-col items-center text-center">
        {/* Avatar image */}
        <div class="relative w-12 h-12 mb-2">
          <div
            class="relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-300 group-hover:border-white group-hover:shadow-lg"
            style={{
              "border-color": accentColor
            }}
          >
            <img
              src={user.profileImage}
              alt={`${user.username}'s profile`}
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
          </div>

          {/* Online status indicator if available */}
          <Show when={user.primaryColor}>
            <div
              class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white transition-transform duration-300 group-hover:scale-110"
              style={{
                "background-color": user.primaryColor || primaryColor
              }}
            />
          </Show>
        </div>

        {/* Username */}
        <p
          class="text-xs font-medium font-poppins transition-all duration-300 group-hover:font-semibold group-hover:text-opacity-90 text-white px-2 py-1 rounded-full bg-black bg-opacity-40 backdrop-blur-sm"
        >
          {user.username}
        </p>
      </div>
    </a>
  );
};

export const UserPillAvatar: Component<UserAvatarProps> = (props) => {
  const {user} = props;

  const primaryColor = user.primaryColor ?? '#E30E50';
  const accentColor = user.accentColor ?? '#3584BF';
  const textColor = getTextColor(primaryColor);

  return (
    <a
      href={`/${user.tiltifySlug}`}
      class="cursor-pointer p-2 rounded-full flex flex-row gap-2 items-center hover:scale-105 hover:brightness-105 transition-all duration-200"
      style={{
        'background-color': primaryColor,
        'color': textColor,
      }}
    >
      <img
        src={user.profileImage}
        alt={`${user.username}'s profile`}
        height="32"
        width="32"
        class="rounded-full w-8 h-8 border-2"
        style={{
          "border-color": accentColor
        }}
        loading="lazy"
      />
      <span class="font-medium font-poppins text-sm">{user.username}</span>
    </a>
  );
};

export const UserSmallPillAvatar: Component<UserAvatarProps> = (props) => {
  const {user} = props;

  const primaryColor = user.primaryColor ?? '#E30E50';
  const accentColor = user.accentColor ?? '#3584BF';
  const textColor = getTextColor(primaryColor);

  return (
    <a
      href={`/${user.tiltifySlug}`}
      class="cursor-pointer p-2 rounded-full flex flex-row gap-2 items-center hover:scale-105 hover:brightness-105 transition-all duration-200"
      style={{
        'background-color': primaryColor,
        'color': textColor,
      }}
    >
      <img
        src={user.profileImage}
        alt={`${user.username}'s profile`}
        height="16"
        width="16"
        class="rounded-full w-4 h-4 border-2"
        style={{
          "border-color": accentColor
        }}
        loading="lazy"
      />
      <span class="font-medium font-poppins text-xs">{user.username}</span>
    </a>
  );
};
