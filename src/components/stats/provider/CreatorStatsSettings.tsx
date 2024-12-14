import type {StatsSettings} from "#lib/model/Stats.ts";
import {createContext, type ParentComponent, useContext} from "solid-js";
import {createStore} from "solid-js/store";
import {type CreatorStatsSettings, StatsValueType, StatsValueTypeCreator} from "../../../lib/model/Stats.ts";

export const useStatsSettingsHook = (initSettings?: CreatorStatsSettings) => {
  const [settings, setSettings] = createStore<CreatorStatsSettings>(initSettings ?? {
    show2021: true,
    show2022: true,
    show2023: true,
    onlyTop15: true,
    value: StatsValueTypeCreator.Appearance,
  })

  const toggleShow2021 = () => setSettings('show2021', s => !s)
  const toggleShow2022 = () => setSettings('show2022', s => !s)
  const toggleShow2023 = () => setSettings('show2023', s => !s)

  const toggleOnlyTop15 = () => setSettings('onlyTop15', s => !s)


  return {
    settings,
    setSettings,
    toggleShow2021,
    toggleShow2022,
    toggleShow2023,
    toggleOnlyTop15,
  }
}

interface CreatorStatsSettingsProps {
  initSettings?: CreatorStatsSettings
}

const CreatorStatsSettingsContext = createContext<ReturnType<typeof useStatsSettingsHook>>();

export const CreatorStatsSettingsProvider: ParentComponent<CreatorStatsSettingsProps> = (props) => {
  const hook = useStatsSettingsHook(props.initSettings)
  return (
    <CreatorStatsSettingsContext.Provider value={hook}>
      {props.children}
    </CreatorStatsSettingsContext.Provider>
  );
}
export const useCreatorStatsSettings = () => useContext(CreatorStatsSettingsContext)!
