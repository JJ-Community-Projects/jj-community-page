import { type Component } from "solid-js";
import { PillComponent } from "./PillComponent";

export const PillComponentDemo: Component = () => {
  const handleClick = () => {
    alert("Pill clicked!");
  };

  return (
    <div class="p-6 space-y-4">
      <h2 class="text-xl font-bold">Pill Component Examples</h2>

      <div class="space-y-2">
        <h3 class="text-lg font-semibold">Basic Pills</h3>
        <div class="flex flex-wrap gap-2">
          {/* Plain pill (p tag) */}
          <PillComponent
            label="Plain Pill"
            class="bg-gray-100 text-gray-800"
          />

          {/* Link pill (a tag) */}
          <PillComponent
            label="Link Pill"
            href="https://example.com"
            class="bg-blue-100 text-blue-800 hover:bg-blue-200"
          />

          {/* Button pill (button tag) */}
          <PillComponent
            label="Button Pill"
            onClick={handleClick}
            class="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
          />
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-lg font-semibold">Styled Pills</h3>
        <div class="flex flex-wrap gap-2">
          {/* Accent colored pill */}
          <PillComponent
            label="Accent Pill"
            class="bg-accent/10 text-accent hover:bg-accent/20"
          />

          {/* Primary colored pill */}
          <PillComponent
            label="Primary Pill"
            class="bg-primary-200 text-white hover:bg-primary-300"
          />

          {/* Custom styled pill */}
          <PillComponent
            label="Custom Pill"
            href="#custom"
            class="bg-purple-500 text-white hover:bg-purple-600 font-bold shadow-md"
          />
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-lg font-semibold">Interactive Pills</h3>
        <div class="flex flex-wrap gap-2">
          {/* Interactive button pill */}
          <PillComponent
            label="Click Me"
            onClick={handleClick}
            class="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:scale-105"
          />

          {/* Interactive link pill */}
          <PillComponent
            label="Visit Page"
            href="#page"
            class="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 hover:scale-105"
          />
        </div>
      </div>
    </div>
  );
};
