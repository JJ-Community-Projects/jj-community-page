import {Select, ToggleButton} from "@kobalte/core";
import {type Component} from "solid-js";
import {twMerge} from "tailwind-merge";
import {AiOutlineCheck} from "solid-icons/ai";
import {useStatsSettings} from "../provider/StatsSettings";
import {StatsValueType} from "../../../lib/model/Stats.ts";


export const StatsControls: Component = () => {

  const {settings, setSettings} = useStatsSettings()
  return (
    <div class={'flex flex-1 flex-row items-center gap-4 p-2 text-white'}>
      <DataSelector/>
      <JJToggle enabledTitle={'Top 15'} disabledTitle={'All'} pressed={settings.onlyTop15} onChange={() => {
        setSettings('onlyTop15', (v) => !v)
      }}/>
      <JJToggle enabledTitle={'Amount'} disabledTitle={'Date'} pressed={settings.order === 'amount'} onChange={() => {
        setSettings('order', (v) => v === 'date' ? 'amount' : 'date')
      }}/>
      <JJToggle enabledTitle={'Include Day 1'} disabledTitle={'Exclude Day 1'} pressed={settings.showDay1}
                onChange={() => {
                  setSettings('showDay1', (v) => !v)
                }}/>

      <JJToggle enabledTitle={'Include Nights'} disabledTitle={'Exclude nights'} pressed={settings.showNights}
                onChange={() => {
                  setSettings('showNights', (v) => !v)
                }}/>

      <JJToggle enabledTitle={'Streams'} disabledTitle={'Hours'} pressed={settings.bar === 'streams'} onChange={() => {
        setSettings('bar', (v) => {
          if (v === 'streams') {
            return 'hours'
          } else {
            return 'streams'
          }
        })
      }}/>

    </div>
  );
}


const DataSelector: Component = () => {

  const {settings, setSettings} = useStatsSettings()

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
      itemComponent={props => (
        <Select.Item
          class={'flex w-full flex-row justify-between p-1 text-white hover:cursor-pointer'}
          item={props.item}
        >
          <Select.ItemLabel>{label(props.item.rawValue)}</Select.ItemLabel>
          <Select.ItemIndicator>
            <AiOutlineCheck/>
          </Select.ItemIndicator>
        </Select.Item>
      )}
    >
      <Select.Trigger class="flex w-32 flex-row items-center justify-between" aria-label="Fruit">
        <Select.Value<string>>{state => label2(state.selectedOption())}</Select.Value>
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
        <Select.Content class="bg-accent-500 rounded shadow">
          <Select.Listbox class="flex flex-col gap-1"/>
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
}> = props => {
  return (
    <ToggleButton.Root
      class={'flex flex-row text-white transition-all'}
      pressed={props.pressed}
      onChange={props.onChange}
    >
      {state => (
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
