import { type Component } from "solid-js";
import { Countdown } from "../common/ui/Countdown";

export const CountdownDemo: Component = () => {
  return (
    <div class="p-6 space-y-4">
      <h2 class="text-xl font-bold">Countdown Component</h2>
      <p class="text-gray-600 mb-4">
        The Countdown component displays a timer counting down to the next Jingle Jam event.
        It shows the date and time in both local and UK time zones (if they're different)
        and the remaining time in days, hours, minutes, and seconds.
      </p>

      <div class="bg-primary-shade/20 p-4 rounded-lg">
        <Countdown />
      </div>

      <div class="mt-4">
        <h3 class="text-lg font-semibold">Features:</h3>
        <ul class="list-disc pl-5 space-y-1 mt-2">
          <li>Displays the exact date and time of the next Jingle Jam event</li>
          <li>Shows both local time and UK time when they differ</li>
          <li>Updates in real-time</li>
          <li>Responsive design that adapts to different screen sizes</li>
          <li>Uses monospace font for the timer for better readability</li>
        </ul>
      </div>
    </div>
  );
};
