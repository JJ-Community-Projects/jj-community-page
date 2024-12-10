import type {StatsSettings} from "#lib/model/Stats.ts";
import {createContext, type ParentComponent, useContext} from "solid-js";
import {createStore} from "solid-js/store";
import {StatsValueType} from "../../../lib/model/Stats.ts";

export const useStatsSettingsHook = (initSettings?: StatsSettings) => {
  const [settings, setSettings] = createStore<StatsSettings>(initSettings ?? {
    show2021: true,
    show2022: true,
    show2023: true,
    onlyTop15: true,
    order: 'amount',
    showDay1: false,
    value: StatsValueType.Yogs,
    showNights: false,
    bar: 'streams',
  })

  const toggleShow2021 = () => setSettings('show2021', s => !s)
  const toggleShow2022 = () => setSettings('show2022', s => !s)
  const toggleShow2023 = () => setSettings('show2023', s => !s)

  const toggleOnlyTop15 = () => setSettings('onlyTop15', s => !s)
  const toggleOrder = () => setSettings('order', s => s === 'date' ? 'amount' : 'date')

  const toggleShowDay1 = () => setSettings('showDay1', s => !s)

  return {
    settings,
    setSettings,
    toggleShow2021,
    toggleShow2022,
    toggleShow2023,
    toggleOnlyTop15,
    toggleOrder,
    toggleShowDay1,
  }
}

interface StatsSettingsProps {
  initSettings?: StatsSettings
}

const StatsSettingsContext = createContext<ReturnType<typeof useStatsSettingsHook>>();

export const StatsSettingsProvider: ParentComponent<StatsSettingsProps> = (props) => {
  const hook = useStatsSettingsHook(props.initSettings)
  return (
    <StatsSettingsContext.Provider value={hook}>
      {props.children}
    </StatsSettingsContext.Provider>
  );
}
export const useStatsSettings = () => useContext(StatsSettingsContext)!
