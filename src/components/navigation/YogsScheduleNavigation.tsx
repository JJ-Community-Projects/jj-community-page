import {getCollection} from "astro:content";
import {type Component} from "solid-js";

interface YogsScheduleNavigationProps {
    paths: string[]
}

export const YogsScheduleNavigation: Component<YogsScheduleNavigationProps> = (props) => {
    return (
      <div class="absolute z-10 hidden w-30 group-hover:block">
          <div class="bg-accent w-full rounded px-2 pb-4 pt-2 shadow-lg">
              <div class="flex flex-col gap-4 text-center md:grid-cols-2">
                  <a class="nav" href={`/yogs`}>Yogs</a>
                  {props.paths.map(path => (<a class="nav" href={`/yogs/schedules/${path}`}>{path}</a>))}
              </div>
          </div>
      </div>
    );
}
