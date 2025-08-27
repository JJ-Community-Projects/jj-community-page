import {type Component} from "solid-js";
import type {UserProfileData} from "../../../../lib/orpc/public/schemas/users.ts";

interface UserAvatarProps {
  user: UserProfileData;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const UserAvatar: Component<UserAvatarProps> = (props) => {
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
            "border-color": user.style.accentColor
          }}
        >
          <img
            src={user.style.profileImage.default}
            alt={`${user.name}'s profile`}
            class="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default UserAvatar;
