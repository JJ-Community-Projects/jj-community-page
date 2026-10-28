import type { Component } from 'solid-js'
import type { UserWithInfo } from '../../../lib/orpc/private/jjData/contract.ts'
import { Avatar } from '../../ui/Avatar'
import { ListRow } from '../../ui/ListRow'

/** A fundraiser with an account: the whole row links to their profile. Shared by both community pages. */
export const CommunityUserItem: Component<{ user: UserWithInfo }> = (props) => (
  <ListRow
    surface="group"
    href={`/${props.user.tiltifySlug}`}
    title={props.user.username}
    subline={
      props.user.tags
        .slice(0, 3)
        .map((tag) => tag.name)
        .join(' · ') || 'Community fundraiser'
    }
    media={
      <Avatar
        src={props.user.profileImage}
        alt=""
        size="md"
        fallback={props.user.username[0]}
      />
    }
  />
)
