import {createContext, type ParentComponent, useContext} from "solid-js";
import type {FullCreator} from "../../../lib/model/ContentTypes.ts";

const useCreatorHook = (creatorMap: { [key: string]: FullCreator }) => {


  const getCreator = (id: string) => {
    return creatorMap[id]
  }

  const color = (id: string) => {
    const c = creatorMap[id]
    return c?.style?.primaryColor ?? '#000'
  }

  const name = (id: string) => {
    const c = creatorMap[id]
    return c ? c.name : id
  }

  return {
    getCreator,
    color,
    name,
  }
}

interface CreatorProps {
  creatorMap: { [key: string]: FullCreator }
}

const CreatorContext = createContext<ReturnType<typeof useCreatorHook>>();

export const CreatorProvider: ParentComponent<CreatorProps> = (props) => {
  const hook = useCreatorHook( props.creatorMap)
  return (
    <CreatorContext.Provider value={hook}>
      {props.children}
    </CreatorContext.Provider>
  );
}
export const useCreator = () => useContext(CreatorContext)!
