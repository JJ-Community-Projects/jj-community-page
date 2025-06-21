import { type Component, createSignal } from "solid-js";
import { FaSolidChevronDown } from "solid-icons/fa";
import { Accordion } from "@kobalte/core";

interface DebugJSONViewProps {
  data: any;
  title: string;
}

export const DebugJSONView: Component<DebugJSONViewProps> = (props) => {
  const [expandedItems, setExpandedItems] = createSignal<string[]>([]);
  const isOpen = () => expandedItems().includes("content");

  return (
    <div class="w-full mb-4">
      <Accordion.Root
        collapsible={true}
        value={expandedItems()}
        onChange={setExpandedItems}
      >
        <Accordion.Item value="content">
          <Accordion.Header>
            <Accordion.Trigger class="bg-white/10 rounded-lg p-4 cursor-pointer w-full">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium text-white">{props.title}</h3>
                <FaSolidChevronDown
                  class={`text-white transition-transform duration-300 ${isOpen() ? 'rotate-180' : ''}`}
                  size={20}
                />
              </div>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>
            <div class="mt-4 p-4 bg-black/20 rounded-md overflow-auto max-h-96">
              <pre class="text-white text-sm whitespace-pre-wrap break-words">
                {JSON.stringify(props.data, null, 2)}
              </pre>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
};
