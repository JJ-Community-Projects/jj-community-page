import {type Component} from "solid-js";
import {Accordion} from "@kobalte/core/accordion";
import {FaSolidCircleInfo, FaSolidChevronDown} from "solid-icons/fa";

interface TagExplanationAccordionProps {
  defaultExpanded?: boolean;
}

/**
 * TagExplanationAccordion Component
 *
 * Displays explanation about user tags in a collapsible accordion format.
 * Enhanced with modern design, branded gradients, and improved animations.
 */
export const TagExplanationAccordion: Component<TagExplanationAccordionProps> = (props) => {
  return (
    <Accordion
      class="mb-6"
      collapsible={true}
      defaultValue={props.defaultExpanded ? ["explanation"] : []}
    >
      <Accordion.Item
        value="explanation"
        class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white/80 backdrop-blur-sm"
      >
        <Accordion.Header>
          <Accordion.Trigger class="group flex justify-between items-center w-full px-6 py-4 text-left transition-all duration-300 hover:bg-gradient-to-r hover:from-accent/5 hover:to-accent/10">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-600 flex items-center justify-center shadow-sm">
                <FaSolidCircleInfo class="w-4 h-4 text-white" />
              </div>
              <span class="font-semibold text-gray-800 ~text-base/lg">About User Tags</span>
            </div>
            <FaSolidChevronDown class="w-5 h-5 text-gray-500 transition-transform duration-300 group-data-[expanded]:rotate-180" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="px-6 pb-6 text-gray-600 ~text-sm/base leading-relaxed space-y-3">
          <p>
            Tags help others discover streamers with similar interests and causes. Choose from available tags to show off
            your favorite games, hobbies, or communities — and don't forget to add a charity tag to highlight the
            cause you're fundraising for.
          </p>
          <p>
            This makes it easier for viewers to connect with you and support the charity you care about most.
          </p>
          <div class="bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg p-4 mt-4 border-l-4 border-accent/30">
            <p class="text-accent-700 font-medium flex items-start gap-2">
              <span class="text-lg">💡</span>
              <span>
                <strong>Pro Tip:</strong> The more relevant your tags, the easier it is for viewers to connect with you and support your stream.
              </span>
            </p>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
};
