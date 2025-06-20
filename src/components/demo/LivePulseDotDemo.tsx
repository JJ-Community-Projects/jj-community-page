import { type Component } from "solid-js";
import { LivePulseDot } from "../common/ui/LivePulseDot";

export const LivePulseDotDemo: Component = () => {
  return (
    <div class="p-6 space-y-4">
      <h2 class="text-xl font-bold">Live Pulse Dot Component</h2>
      <p class="text-gray-600 mb-4">
        The LivePulseDot component is a visual indicator that shows when content is live.
        It features a pulsing animation to draw attention and clearly communicates the live status.
      </p>

      <div class="flex flex-col space-y-6">
        <div>
          <h3 class="text-lg font-semibold mb-2">Default Live Indicator</h3>
          <div class="bg-gray-100 p-4 rounded-lg inline-block">
            <LivePulseDot />
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2">Usage Example</h3>
          <div class="bg-gray-100 p-4 rounded-lg flex items-center space-x-3">
            <LivePulseDot />
            <span class="text-gray-800">Yogscast Main Channel Stream</span>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <h3 class="text-lg font-semibold">Features:</h3>
        <ul class="list-disc pl-5 space-y-1 mt-2">
          <li>Animated pulsing effect to draw attention</li>
          <li>Clear "LIVE" text label</li>
          <li>Accent color background for high visibility</li>
          <li>Compact design that can be placed inline with other content</li>
          <li>No props required - simple to implement</li>
        </ul>
      </div>
    </div>
  );
};
