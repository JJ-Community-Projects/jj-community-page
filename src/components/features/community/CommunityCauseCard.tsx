import { type Component, Show } from 'solid-js'
import type { JJCauseType } from '../../../lib/orpc/private/jjData/contract.ts'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { cn, tileSurface } from '../../ui/cn'
import { Raised } from '../../ui/Labels'
import { Money, raisedIn } from './FundraiserCard.tsx'

/** Group header for "sort by cause": the charity with its total and links, above its fundraisers. */
export const CommunityCauseCard: Component<{ cause: JJCauseType }> = (
  props,
) => {
  const { currency } = useCommunityPage()
  return (
    <div class={cn(tileSurface, 'flex flex-wrap items-center gap-3 p-3')}>
      <Avatar
        src={props.cause.logo}
        alt=""
        size="md"
        fallback={props.cause.name[0]}
      />
      <div class="min-w-0 flex-1 basis-48">
        <h3 class="font-semibold">{props.cause.name}</h3>
        <Show when={props.cause.description}>
          <p class="text-fg-muted line-clamp-1 text-xs">
            {props.cause.description}
          </p>
        </Show>
      </div>
      <Raised size="md">
        <Money
          value={raisedIn(props.cause.raised, currency())}
          currency={currency()}
        />
      </Raised>
      <div class="flex gap-1.5">
        <Button href={props.cause.url} target="_blank" size="sm">
          Learn more
        </Button>
        <Button
          href={props.cause.donateUrl}
          target="_blank"
          size="sm"
          variant="primary"
        >
          Donate
        </Button>
      </div>
    </div>
  )
}
