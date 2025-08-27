import {type Component} from "solid-js";
import type {ScheduleWeek} from "../../../../lib/orpc/public/schemas/schedules.ts";

interface ScheduleWeekCollapsibleDaysProps {
  week: ScheduleWeek
}

export const ScheduleWeekCollapsibleDays: Component<ScheduleWeekCollapsibleDaysProps> = (props) => {
  return (
    <div></div>
  );
}

// Accordion example
/*
import { Accordion } from "@kobalte/core/accordion";
import { ChevronDownIcon } from "some-icon-library";
import "./style.css";
function App() {
  return (
    <Accordion class="accordion" defaultValue={["item-1"]}>
      <Accordion.Item class="accordion__item" value="item-1">
        <Accordion.Header class="accordion__item-header">
          <Accordion.Trigger class="accordion__item-trigger">
            <span>Is it accessible?</span>
            <ChevronDownIcon class="accordion__item-trigger-icon" aria-hidden />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="accordion__item-content">
          <p class="accordion__item-content-text">
            Yes. It adheres to the WAI-ARIA design pattern.
          </p>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item class="accordion__item" value="item-2">
        <Accordion.Header class="accordion__item-header">
          <Accordion.Trigger class="accordion__item-trigger">
            <span>Is it unstyled?</span>
            <ChevronDownIcon class="accordion__item-trigger-icon" aria-hidden />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="accordion__item-content">
          <p class="accordion__item-content-text">
            Yes. It's unstyled by default, giving you freedom over the look and feel.
          </p>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item class="accordion__item" value="item-3">
        <Accordion.Header class="accordion__item-header">
          <Accordion.Trigger class="accordion__item-trigger">
            <span>Can it be animated?</span>
            <ChevronDownIcon class="accordion__item-trigger-icon" aria-hidden />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="accordion__item-content">
          <p class="accordion__item-content-text">
            Yes! You can animate the Accordion with CSS or JavaScript.
          </p>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
 */
