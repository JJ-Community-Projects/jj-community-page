import { Select, ToggleButton } from '@kobalte/core'
import { type Component, Index } from 'solid-js'
import { twMerge } from 'tailwind-merge'
import { FaSolidCheck } from 'solid-icons/fa'
import { useStatsSettings } from '../provider/StatsSettings'
import { StatsValueType } from '../../../../lib/model/Stats.ts'
import { useStats } from '../provider/StatsProvider.tsx'
import { useCreator } from '../provider/CreatorProvider.tsx'

export const StatsControls: Component = () => {
  const { settings, setSettings } = useStatsSettings()
  return (
    <div class={'flex flex-1 flex-col items-center gap-4 p-2 text-white'}>
      <div class={'flex flex-row items-center gap-4 p-2 text-white'}>
        <DataSelector />
        <CreatorSelector />
        <JJToggle
          enabledTitle={'Top 15'}
          disabledTitle={'All'}
          pressed={settings.onlyTop15}
          onChange={() => {
            setSettings('onlyTop15', (v) => !v)
          }}
        />
        <JJToggle
          enabledTitle={'Amount'}
          disabledTitle={'Date'}
          pressed={settings.order === 'amount'}
          onChange={() => {
            setSettings('order', (v) => (v === 'date' ? 'amount' : 'date'))
          }}
        />
        <JJToggle
          enabledTitle={'Include Day 1'}
          disabledTitle={'Exclude Day 1'}
          pressed={settings.showDay1}
          onChange={() => {
            setSettings('showDay1', (v) => !v)
          }}
        />

        <JJToggle
          enabledTitle={'Include Nights'}
          disabledTitle={'Exclude nights'}
          pressed={settings.showNights}
          onChange={() => {
            setSettings('showNights', (v) => !v)
          }}
        />

        <JJToggle
          enabledTitle={'Streams'}
          disabledTitle={'Hours'}
          pressed={settings.bar === 'streams'}
          onChange={() => {
            setSettings('bar', (v) => {
              if (v === 'streams') {
                return 'hours'
              } else {
                return 'streams'
              }
            })
          }}
        />
      </div>
      <DaysSelector />
    </div>
  )
}

const DataSelector: Component = () => {
  const { settings, setSettings } = useStatsSettings()

  const label = (v: StatsValueType) => {
    switch (v) {
      case StatsValueType.Total:
        return 'Total'
      case StatsValueType.TotalPerMinute:
        return 'Total Per Minute'
      case StatsValueType.Yogs:
        return 'Yogs'
      case StatsValueType.YogsPerMinute:
        return 'Donations Per Minute to Yogs'
      case StatsValueType.Fundraiser:
        return 'Fundraiser'
      case StatsValueType.FundraiserPerMinute:
        return 'Donations Per Minute to Fundraisers'
      case StatsValueType.Collections:
        return 'Collections'
      case StatsValueType.CollectionsPerMinute:
        return 'Collections Per Minute'
      case StatsValueType.Donations:
        return 'Donations'
      case StatsValueType.DonationsPerMinute:
        return 'Donations Per Minute'
      case StatsValueType.AvgDonationAmount:
        return 'Avg Donation Amount'
    }
  }
  const label2 = (v: string) => {
    switch (v) {
      case StatsValueType.Total:
        return 'Total'
      case StatsValueType.TotalPerMinute:
        return 'Total Per Minute'
      case StatsValueType.Yogs:
        return 'Yogs'
      case StatsValueType.YogsPerMinute:
        return 'Donations Per Minute to Yogs'
      case StatsValueType.Fundraiser:
        return 'Fundraiser'
      case StatsValueType.FundraiserPerMinute:
        return 'Donations Per Minute to Fundraisers'
      case StatsValueType.Collections:
        return 'Collections'
      case StatsValueType.CollectionsPerMinute:
        return 'Collections Per Minute'
      case StatsValueType.Donations:
        return 'Donations'
      case StatsValueType.DonationsPerMinute:
        return 'Donations Per Minute'
      case StatsValueType.AvgDonationAmount:
        return 'Avg Donation Amount'
    }
  }

  return (
    <Select.Root<StatsValueType>
      class="row col w-32 gap-4 p-2"
      value={settings.value}
      placeholder="Select a Data"
      onChange={(v) => {
        console.log(v)
        if (v) {
          setSettings('value', v)
        }
      }}
      options={[
        StatsValueType.Total,
        StatsValueType.TotalPerMinute,
        StatsValueType.Yogs,
        StatsValueType.YogsPerMinute,
        StatsValueType.Fundraiser,
        StatsValueType.FundraiserPerMinute,
        StatsValueType.Collections,
        StatsValueType.CollectionsPerMinute,
        StatsValueType.Donations,
        StatsValueType.DonationsPerMinute,
        StatsValueType.AvgDonationAmount,
      ]}
      itemComponent={(props) => (
        <Select.Item
          class={
            'flex w-full flex-row justify-between p-1 text-white hover:cursor-pointer'
          }
          item={props.item}
        >
          <Select.ItemLabel>{label(props.item.rawValue)}</Select.ItemLabel>
          <Select.ItemIndicator>
            <FaSolidCheck />
          </Select.ItemIndicator>
        </Select.Item>
      )}
    >
      <Select.Trigger
        class="flex w-32 flex-row items-center justify-between"
        aria-label="Fruit"
      >
        <Select.Value<string>>
          {(state) => label2(state.selectedOption())}
        </Select.Value>
        <Select.Icon class="select__icon">
          <svg
            fill="currentColor"
            stroke-width="0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            height="2em"
            width="2em"
            style="overflow: visible; --darkreader-inline-fill: currentColor;"
            data-darkreader-inline-fill=""
          >
            <path
              fill="currentColor"
              d="m12 15-4.243-4.242 1.415-1.414L12 12.172l2.828-2.828 1.415 1.414L12 15.001Z"
              data-darkreader-inline-fill=""
              style="--darkreader-inline-fill: currentColor;"
            ></path>
          </svg>
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content class="rounded bg-accent-500 shadow">
          {/* Make long creator lists scrollable */}
          <Select.Listbox class="flex max-h-80 flex-col gap-1 overflow-y-auto" />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

// Allows selecting specific December days (1–14) to filter streams by date
const DaysSelector: Component = () => {
  const { settings, setSettings } = useStatsSettings()

  const has = (day: number) => settings.days.includes(day)
  const toggleDay = (day: number) => {
    if (has(day)) {
      setSettings(
        'days',
        settings.days.filter((d) => d !== day),
      )
    } else {
      setSettings('days', [...settings.days, day])
    }
  }

  const clearAll = () => setSettings('days', [])

  return (
    <div class={'flex flex-row items-center gap-2'}>
      <span class={'text-xs opacity-80'}>Days:</span>
      <div class={'flex flex-row flex-wrap'}>
        <Index each={Array.from({ length: 14 })}>
          {(_, i) => {
            const day = i + 1
            const first = i === 0
            const last = i === 13

            return (
              <ToggleButton.Root
                class={'flex flex-row text-white transition-all'}
                pressed={has(day)}
                onChange={() => toggleDay(day)}
              >
                {(state) => (
                  <>
                    <div
                      class={twMerge(
                        'bg-white py-1 px-4 text-xs text-black opacity-75 transition-all',
                        state.pressed() && 'bg-accent text-white opacity-100',
                        first && 'rounded-l-2xl pl-6',
                        last && 'rounded-r-2xl pr-6',
                      )}
                    >
                      {day}
                    </div>
                  </>
                )}
              </ToggleButton.Root>
            )

          }}
        </Index>
      </div>
      <button
        class={'text-xs underline opacity-80 hover:opacity-100'}
        onClick={clearAll}
      >
        All
      </button>
    </div>
  )
}
/*
            return (
              <ToggleButton.Root
                class={twMerge(
                  'border-1 min-w-[28px] rounded-md border-accent-500 px-1 py-0.5 text-xs transition-all',
                  has(day)
                    ? 'bg-accent text-white'
                    : 'bg-transparent hover:bg-accent-500/30',
                )}
                pressed={has(day)}
                onChange={() => toggleDay(day)}
              >
                {day}
              </ToggleButton.Root>
            )*/

// Allows selecting a single creator to filter streams by that creator
const CreatorSelector: Component = () => {
  const { settings, setSettings } = useStatsSettings()
  const { creators } = useStats()
  const { getCreator } = useCreator()

  const selected = () => settings.creators[0] ?? ''

  const fullCreators = () => {
    return creators()
      .map((c) => getCreator(c.id))
      .filter((c) => c !== undefined)
      .filter((c) => c.type === 'yogs')
      .toSorted((a, b) => a.name.localeCompare(b.name))
  }

  return (
    <Select.Root<string>
      class="w-48 gap-4 p-2"
      value={selected()}
      placeholder="Creator: All"
      onChange={(v) => {
        if (!v || v === '') {
          setSettings('creators', [])
        } else {
          setSettings('creators', [v])
        }
      }}
      // First option is All (no filter), then creators from stats
      options={['', ...fullCreators().map((c) => c.id)]}
      itemComponent={(props) => {
        const creator = getCreator(props.item.rawValue)
        return (
          <Select.Item
            class={
              'flex w-full flex-row justify-between p-1 text-white hover:cursor-pointer'
            }
            item={props.item}
          >
            <Select.ItemLabel>
              {props.item.rawValue === '' ? 'All creators' : creator.name}
            </Select.ItemLabel>
            <Select.ItemIndicator>
              <FaSolidCheck />
            </Select.ItemIndicator>
          </Select.Item>
        )
      }}
    >
      <Select.Trigger
        class="flex w-48 flex-row items-center justify-between"
        aria-label="Creator"
      >
        <Select.Value<string>>
          {(state) => {
            const v = state.selectedOption()
            const creator = getCreator(v)
            if (!v || v === '') return 'Creator: All'
            return `Creator: ${creator.name}`
          }}
        </Select.Value>
        <Select.Icon class="select__icon">
          <svg
            fill="currentColor"
            stroke-width="0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            height="2em"
            width="2em"
            style="overflow: visible; --darkreader-inline-fill: currentColor;"
            data-darkreader-inline-fill=""
          >
            <path
              fill="currentColor"
              d="m12 15-4.243-4.242 1.415-1.414L12 12.172l2.828-2.828 1.415 1.414L12 15.001Z"
              data-darkreader-inline-fill=""
              style="--darkreader-inline-fill: currentColor;"
            ></path>
          </svg>
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content class="rounded bg-accent-500 shadow">
          <Select.Listbox class="flex max-h-72 flex-col gap-1 overflow-y-auto" />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

const JJToggle: Component<{
  enabledTitle: string
  disabledTitle: string
  pressed: boolean
  onChange: (pressed: boolean) => void
}> = (props) => {
  return (
    <ToggleButton.Root
      class={'flex flex-row text-white transition-all'}
      pressed={props.pressed}
      onChange={props.onChange}
    >
      {(state) => (
        <>
          <div
            class={twMerge(
              'rounded-l-2xl bg-white p-1 text-xs text-black opacity-75 transition-all',
              !state.pressed() && 'bg-accent text-white opacity-100',
            )}
          >
            {props.disabledTitle}
          </div>
          <div
            class={twMerge(
              'rounded-r-2xl bg-white p-1 text-xs text-black opacity-75 transition-all',
              state.pressed() && 'bg-accent text-white opacity-100',
            )}
          >
            {props.enabledTitle}
          </div>
        </>
      )}
    </ToggleButton.Root>
  )
}
