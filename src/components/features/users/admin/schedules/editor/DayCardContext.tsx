import {createContext, type ParentComponent, useContext} from "solid-js";
import {DateTime} from "luxon";

const useDayCardHook = (
  start: DateTime,
  end: DateTime,
) => {

  // min="2018-06-07T00:00"
  // max="2018-06-14T00:00"
  const minStr = start.startOf('day').toFormat("yyyy-MM-dd'T'HH:mm");
  const maxStr = end.endOf("day").toFormat("yyyy-MM-dd'T'HH:mm");
  return {
    minStr,
    maxStr,
  }
}

interface DayCardProps {
  start: DateTime;
  end: DateTime;
}

const DayCardContext = createContext<ReturnType<typeof useDayCardHook>>();

export const DayCardProvider: ParentComponent<DayCardProps> = (props) => {
  const hook = useDayCardHook(props.start, props.end);
  return (
    <DayCardContext.Provider value={hook}>
      {props.children}
    </DayCardContext.Provider>
  );
}
export const useDayCard = () => useContext(DayCardContext)!
