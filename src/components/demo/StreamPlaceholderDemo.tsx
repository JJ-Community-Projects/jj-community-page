import { type Component } from "solid-js";
import { StreamPlaceholder } from "../yogs-pages/schedule/placeholder/StreamPlaceholder";

export const StreamPlaceholderDemo: Component = () => {
  // Create sample stream data for the demo
  const createSampleStream = (colors: string[], orientation: string, tileSize: number = 1) => {
    return {
      id: 1,
      title: "Sample Stream",
      start: new Date(),
      end: new Date(),
      style: {
        tileSize,
        background: {
          colors,
          orientation
        }
      }
    };
  };

  return (
    <div class="p-6 space-y-4">
      <h2 class="text-xl font-bold">Stream Placeholder Component</h2>
      <p class="text-gray-600 mb-4">
        The StreamPlaceholder component creates a visual placeholder for streams with customizable
        gradient backgrounds, colors, and sizes. It's used in schedule displays when the actual
        stream content isn't available or is loading.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-lg font-semibold mb-2">Default (Yellow to Magenta)</h3>
          <div class="bg-gray-100 p-4 rounded-lg">
            <StreamPlaceholder
              stream={createSampleStream(['#ff0', '#f0f'], 'LR')}
            />
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2">Blue to Green (Left to Right)</h3>
          <div class="bg-gray-100 p-4 rounded-lg">
            <StreamPlaceholder
              stream={createSampleStream(['#0088ff', '#00ff88'], 'LR')}
            />
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2">Red to Yellow (Top to Bottom)</h3>
          <div class="bg-gray-100 p-4 rounded-lg">
            <StreamPlaceholder
              stream={createSampleStream(['#ff0000', '#ffff00'], 'TD')}
            />
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2">Purple to Pink (Diagonal)</h3>
          <div class="bg-gray-100 p-4 rounded-lg">
            <StreamPlaceholder
              stream={createSampleStream(['#8800ff', '#ff00aa'], 'TLBR')}
            />
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2">Double Height</h3>
          <div class="bg-gray-100 p-4 rounded-lg">
            <StreamPlaceholder
              stream={createSampleStream(['#00aaff', '#00ffaa'], 'TRBL', 2)}
            />
          </div>
        </div>
      </div>

      <div class="mt-4">
        <h3 class="text-lg font-semibold">Features:</h3>
        <ul class="list-disc pl-5 space-y-1 mt-2">
          <li>Customizable gradient colors</li>
          <li>Multiple gradient orientations (horizontal, vertical, diagonal)</li>
          <li>Adjustable height based on tile size</li>
          <li>Automatic text color contrast based on background</li>
          <li>Rounded corners for a modern look</li>
        </ul>
      </div>

      <div class="mt-4 bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold">Usage Example:</h3>
        <pre class="bg-gray-800 text-white p-3 rounded-md overflow-x-auto text-sm mt-2">
          {`
// Import the component
import { StreamPlaceholder } from "../yogs-pages/schedule/placeholder/StreamPlaceholder";

// Create a stream object with style information
const stream = {
  id: 123,
  title: "My Stream",
  start: new Date(),
  end: new Date(),
  style: {
    tileSize: 1, // Height multiplier
    background: {
      colors: ['#ff0000', '#0000ff'], // Red to blue gradient
      orientation: 'LR' // Left to right
    }
  }
};

// Render the placeholder
<StreamPlaceholder stream={stream} />
          `}
        </pre>
      </div>
    </div>
  );
};
