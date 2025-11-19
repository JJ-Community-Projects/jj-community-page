import { type Component } from 'solid-js'
import type { YogsStream } from '../../../../lib/orpc/private/yogs/contract.ts'


interface StreamPlaceholderProps {
  stream: YogsStream
}

export const StreamPlaceholder: Component<StreamPlaceholderProps> = (props) => {
  const stream = props.stream
  const tileSize = stream.size

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
          color: stream.color,
          'background-color': stream.color
        }}
      />

    </div>
  );
}
