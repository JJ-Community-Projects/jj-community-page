import { type Component, createSignal } from "solid-js";
import { ConfirmationDialog } from "../common/dialogs/ConfirmationDialog";

export const ConfirmationDialogDemo: Component = () => {
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);
  const [result, setResult] = createSignal<string | null>(null);

  const handleConfirm = () => {
    setResult("Action confirmed!");
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setResult("Action cancelled.");
    setIsDialogOpen(false);
  };

  return (
    <div class="p-6 space-y-4">
      <h2 class="text-xl font-bold">Confirmation Dialog Component</h2>
      <p class="text-gray-600 mb-4">
        The ConfirmationDialog component is a modal dialog that asks users to confirm or cancel an action.
        It provides a clear title, descriptive text, and action buttons.
      </p>

      <div class="flex flex-col space-y-4">
        <button
          onClick={() => setIsDialogOpen(true)}
          class="px-4 py-2 bg-accent text-white rounded-md w-fit hover:bg-accent-400"
        >
          Open Dialog
        </button>

        {result() && (
          <div class="bg-gray-100 p-4 rounded-lg">
            <p>Result: <span class="font-semibold">{result()}</span></p>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isDialogOpen()}
        onOpenChange={setIsDialogOpen}
        title="Confirm Action"
        text="Are you sure you want to perform this action? This cannot be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <div class="mt-4">
        <h3 class="text-lg font-semibold">Features:</h3>
        <ul class="list-disc pl-5 space-y-1 mt-2">
          <li>Modal overlay that focuses user attention</li>
          <li>Clear title and descriptive text</li>
          <li>Confirm and cancel buttons with appropriate styling</li>
          <li>Controlled through simple props</li>
          <li>Built with Kobalte Dialog for accessibility</li>
          <li>Customizable through props</li>
        </ul>
      </div>

      <div class="mt-4 bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold">Usage Example:</h3>
        <pre class="bg-gray-800 text-white p-3 rounded-md overflow-x-auto text-sm mt-2">
          {`
// Import the component
import { ConfirmationDialog } from "../common/dialogs/ConfirmationDialog";

// Create state for dialog visibility
const [isOpen, setIsOpen] = createSignal(false);

// Handle confirm/cancel actions
const handleConfirm = () => {
  // Perform action
  setIsOpen(false);
};

const handleCancel = () => {
  setIsOpen(false);
};

// Render the dialog
<ConfirmationDialog
  isOpen={isOpen()}
  onOpenChange={setIsOpen}
  title="Confirm Delete"
  text="Are you sure you want to delete this item?"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
          `}
        </pre>
      </div>
    </div>
  );
};
