import {type Component} from "solid-js";
import type {FullStream} from "../../lib/model/ContentTypes.ts";
import {getTextColor} from "../../lib/utils/textColors.ts";

interface StreamPlaceholderProps {
  stream: FullStream
}

export const StreamPlaceholder: Component<StreamPlaceholderProps> = (props) => {
  const stream = props.stream
  const style = stream.style
  const tileSize = style.tileSize
  const colors = style.background.colors ?? ['#ff0', '#f0f']
  const orientation = style.background.orientation

  function orientationInCss() {
    switch (orientation) {
      case 'TD':
        return 'to bottom'
      case 'LR':
        return 'to right'
      case 'RL':
        return 'to left'
      case 'DT':
        return 'to top'
      case 'TLBR':
        return 'to bottom right'
      case 'TRBL':
        return 'to bottom left'
      default:
        return orientation
    }
  }

  const gradient = `linear-gradient(${orientationInCss()}, ${colors.join(', ')})`
  return (
    <div
      style={{
        height: `calc(${tileSize} * var(--jj-schedule-slot-size))`,
        width: '100%',
      }}
      class="p-1.5"
    >

      <div
        class={"w-full h-full rounded-2xl p-1 flex flex-col text-center items-center justify-center"}
        style={{
          'background-image': gradient,
          color: getTextColor(colors[0]),
        }}
      />

    </div>
  );
}
