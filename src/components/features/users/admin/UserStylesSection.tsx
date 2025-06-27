import {
  type Component,
  createSignal,
  Show,
  createResource,
  createEffect,
} from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import { Dialog } from "@kobalte/core/dialog";
import { createModalSignal } from "../../../../lib/createModalSignal.ts";
import { useUser } from "./providers/UserProvider.tsx";

export const UserStylesSection: Component = () => {
  // Get user context
  const {
    local,
    user,
    updateUserStyle,
    action
  } = useUser();

  // State for color inputs and dialog
  const DEFAULT_PRIMARY_COLOR = "#E30E50";
  const DEFAULT_ACCENT_COLOR = "#3584BF";
  const [primaryColor, setPrimaryColor] = createSignal(DEFAULT_PRIMARY_COLOR);
  const [accentColor, setAccentColor] = createSignal(DEFAULT_ACCENT_COLOR);
  const modal = createModalSignal();

  // Update local state when user style changes
  createEffect(() => {
    if (local.userStyle) {
      setPrimaryColor(local.userStyle.primaryColor);
      setAccentColor(local.userStyle.accentColor);
    }
  });

  // Handle saving user styles
  const handleSaveStyles = async () => {
    try {
      await updateUserStyle(primaryColor(), accentColor());
      modal.close();
    } catch (error) {
      console.error("Error saving styles:", error);
    }
  };

  // Handle resetting colors to default
  const handleResetColors = () => {
    setPrimaryColor(DEFAULT_PRIMARY_COLOR);
    setAccentColor(DEFAULT_ACCENT_COLOR);
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">User Style</h3>
        <button
          type="button"
          onClick={modal.open}
          class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-600 transition-all"
          disabled={action.updateUserStyle.actionInProgress}
        >
          {action.updateUserStyle.actionInProgress ? 'Saving...' : 'Edit Colors'}
        </button>
      </div>

      {/* Error Message */}
      <Show when={action.updateUserStyle.lastErrorMessage}>
        <div class="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          Error: {action.updateUserStyle.lastErrorMessage}
        </div>
      </Show>

      {/* Current Colors Display */}
      <div class="mt-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Your Colors:</p>
        <div class="flex gap-4">
          <div class="flex flex-col items-center">
            <div
              class="w-16 h-16 rounded-lg shadow-md"
              style={{ "background-color": primaryColor() }}
            ></div>
            <span class="text-sm mt-1">Primary</span>
            <span class="text-xs text-gray-500">{primaryColor()}</span>
          </div>
          <div class="flex flex-col items-center">
            <div
              class="w-16 h-16 rounded-lg shadow-md"
              style={{ "background-color": accentColor() }}
            ></div>
            <span class="text-sm mt-1">Accent</span>
            <span class="text-xs text-gray-500">{accentColor()}</span>
          </div>
        </div>
      </div>

      {/* Edit Colors Dialog */}
      <Dialog open={modal.isOpen()} onOpenChange={modal.setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 bg-black/50 z-40"/>
          <div class="fixed inset-0 flex items-center justify-center z-50">
            <Dialog.Content class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <Dialog.Title class="text-xl font-bold mb-4">Edit Your Colors</Dialog.Title>
              <Dialog.Description class="text-gray-600 mb-4">
                Choose your primary and accent colors for your profile.
              </Dialog.Description>

              <div class="space-y-4">
                <TextField value={primaryColor()} onChange={setPrimaryColor}>
                  <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">Primary Color</TextField.Label>
                  <div class="flex gap-2 items-center">
                    <div
                      class="w-8 h-8 rounded-md shadow-sm"
                      style={{ "background-color": primaryColor() }}
                    ></div>
                    <TextField.Input
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="#E30E50"
                      type="color"
                    />
                  </div>
                  <TextField.Description class="mt-1 text-sm text-gray-500">
                    This color will be used as your primary brand color.
                  </TextField.Description>
                </TextField>

                <TextField value={accentColor()} onChange={setAccentColor}>
                  <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">Accent Color</TextField.Label>
                  <div class="flex gap-2 items-center">
                    <div
                      class="w-8 h-8 rounded-md shadow-sm"
                      style={{ "background-color": accentColor() }}
                    ></div>
                    <TextField.Input
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="#3584BF"
                      type="color"
                    />
                  </div>
                  <TextField.Description class="mt-1 text-sm text-gray-500">
                    This color will be used as your accent color for highlights and secondary elements.
                  </TextField.Description>
                </TextField>
              </div>

              <div class="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={modal.close}
                  disabled={action.updateUserStyle.actionInProgress}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={handleResetColors}
                  disabled={action.updateUserStyle.actionInProgress}
                >
                  Reset to Default
                </button>
                <button
                  type="button"
                  class="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-600"
                  onClick={handleSaveStyles}
                  disabled={action.updateUserStyle.actionInProgress}
                >
                  {action.updateUserStyle.actionInProgress ? 'Saving...' : 'Save Colors'}
                </button>
              </div>

              {/* Error Message */}
              <Show when={action.updateUserStyle.lastErrorMessage}>
                <div class="mt-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">
                  Error: {action.updateUserStyle.lastErrorMessage}
                </div>
              </Show>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog>
    </div>
  );
};
