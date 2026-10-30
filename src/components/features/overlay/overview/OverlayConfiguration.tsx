import { type Component, createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { UserScheduleConfigurator } from '../schedule/user/UserScheduleConfigurator.tsx'
import { FundraisersTickerConfigurator } from '../ticker/fundraisers/FundraisersTickerConfigurator.tsx'
import { CharitiesTickerConfigurator } from '../ticker/charities/CharitiesTickerConfigurator.tsx'
import { CharitiesConfigurator } from '../charities/CharitiesConfigurator.tsx'
import { DonationMatchesConfigurator } from '../donationMatches/DonationMatchesConfigurator.tsx'
import { FundraisersByTeamConfigurator } from '../ticker/fundraisers/FundraisersByTeamConfigurator.tsx'
import { FundraisersByCauseConfigurator } from '../ticker/fundraisers/FundraisersByCauseConfigurator.tsx'
import { UserProvider } from '../../users/user-dashboard/providers/UserProvider.tsx'
import type { User } from '../../../../lib/auth/User.ts'
import { TeamScheduleConfigurator } from '../schedule/team/TeamScheduleConfigurator.tsx'
import { CampaignGoalConfigurator } from '../jjRibbons/campaignGoal/CampaignGoalConfigurator.tsx'
import { BasicRibbonLabelConfigurator } from '../jjRibbons/basicRibbonLabel/BasicRibbonLabelConfigurator.tsx'
import { BigCampaignGoalConfigurator } from '../jjRibbons/bigCampaignGoal/BigCampaignGoalConfigurator.tsx'
import { OVERLAY_FORMATS, type OverlayId } from './formats'
import { Accordion, AccordionItem } from '../../../ui/Accordion'
import { Button } from '../../../ui/Button'
import { Chip, DateDivider } from '../../../ui/Labels'
import { EmptyState } from '../../../ui/Status'
import { Tile } from '../../../ui/Tile'

type Overlay = {
  id: OverlayId
  title: string
  group: (typeof GROUPS)[number]
  /** `login`: listed for everyone, configurable when logged in; `account`: only listed when logged in. */
  access: 'public' | 'login' | 'account'
  configurator: Component
}

const GROUPS = ['Panels', 'Tickers', 'Jingle Jam ribbons'] as const

const OVERLAYS: Overlay[] = [
  { id: 'charities2', title: 'Charities panel', group: 'Panels', access: 'public', configurator: CharitiesConfigurator },
  { id: 'donation-matches', title: 'Active donation matches', group: 'Panels', access: 'public', configurator: DonationMatchesConfigurator },
  { id: 'schedule', title: 'Your schedule panel', group: 'Panels', access: 'login', configurator: UserScheduleConfigurator },
  { id: 'team-schedule', title: 'Team schedule panel', group: 'Panels', access: 'login', configurator: TeamScheduleConfigurator },
  { id: 'charities', title: 'Charities ticker', group: 'Tickers', access: 'public', configurator: CharitiesTickerConfigurator },
  { id: 'fundraisers', title: 'All fundraisers ticker', group: 'Tickers', access: 'public', configurator: FundraisersTickerConfigurator },
  { id: 'team-fundraiser', title: 'Fundraisers by team ticker', group: 'Tickers', access: 'login', configurator: FundraisersByTeamConfigurator },
  { id: 'cause-fundraiser', title: 'Fundraisers by charity ticker', group: 'Tickers', access: 'public', configurator: FundraisersByCauseConfigurator },
  { id: 'campaign-goal', title: 'Campaign goal', group: 'Jingle Jam ribbons', access: 'account', configurator: CampaignGoalConfigurator },
  { id: 'big-campaign-goal', title: 'Big campaign goal', group: 'Jingle Jam ribbons', access: 'account', configurator: BigCampaignGoalConfigurator },
  { id: 'basic-ribbon-label', title: 'Basic label', group: 'Jingle Jam ribbons', access: 'account', configurator: BasicRibbonLabelConfigurator },
]

const LoginCallToAction: Component = () => (
  <Tile>
    <EmptyState
      title="Log in to set up this overlay"
      action={
        <Button variant="accent" href="/login">
          Log in
        </Button>
      }
    >
      It shows your own schedule or teams, so it needs your account.
    </EmptyState>
  </Tile>
)

const Body: Component<{ loggedIn: boolean; level?: 2 | 3 }> = (p) => {
  // One overlay open at a time: each open configurator runs a live preview
  const [expanded, setExpanded] = createSignal<string[]>([])
  const listed = (group: Overlay['group']) =>
    OVERLAYS.filter(
      (o) => o.group === group && (p.loggedIn || o.access !== 'account'),
    )

  return (
    <Accordion
      collapsible
      value={expanded()}
      onChange={setExpanded}
      class="flex w-full flex-col gap-2"
    >
      <For each={GROUPS}>
        {(group) => (
          <Show when={listed(group).length > 0}>
            <DateDivider class="mt-2">{group}</DateDivider>
            <For each={listed(group)}>
              {(overlay) => (
                <AccordionItem
                  value={overlay.id}
                  title={overlay.title}
                  level={p.level}
                  summary={
                    <Show when={OVERLAY_FORMATS[overlay.id].obs}>
                      {(obs) => <Chip size="sm">{obs()}</Chip>}
                    </Show>
                  }
                >
                  <Show
                    when={p.loggedIn || overlay.access === 'public'}
                    fallback={<LoginCallToAction />}
                  >
                    <Dynamic component={overlay.configurator} />
                  </Show>
                </AccordionItem>
              )}
            </For>
          </Show>
        )}
      </For>
    </Accordion>
  )
}

/** The overlay list with a configurator per overlay; logged-out visitors get a login prompt where an overlay needs the account. */
export const OverlayConfiguration: Component<{
  user: User | null
  /** Heading level of the overlay rows: 2 on `/overlays`, 3 (default) inside another accordion. */
  level?: 2 | 3
}> = (props) => {
  const client = new QueryClient()
  return (
    <UserProvider user={props.user as User}>
      <QueryClientProvider client={client}>
        <Body loggedIn={props.user !== null} level={props.level} />
      </QueryClientProvider>
    </UserProvider>
  )
}
