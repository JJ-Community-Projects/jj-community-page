import {type Component, type JSX, type ParentComponent} from "solid-js";
import { Accordion } from "@kobalte/core/accordion";
import { FaSolidChevronDown } from "solid-icons/fa";

interface UserAccordionSectionProps {
  title: string;
  value: string;
}

export const UserAccordionSection: ParentComponent<UserAccordionSectionProps> = (props) => {
  return (
    <div class="h-full">
      <Accordion class="accordion mb-4" multiple>
        <Accordion.Item value={props.value} class="accordion__item mb-4">
          <Accordion.Header class="accordion__item-header">
            <Accordion.Trigger
              class="accordion__item-trigger"
            >
              <span>{props.title}</span>
              <FaSolidChevronDown class="w-5 h-5 accordion__item-trigger-icon" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="accordion__item-content">
            {props.children}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};
