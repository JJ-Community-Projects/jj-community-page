import { type Component, createEffect, createSignal, on, Show } from 'solid-js'
import { TextField } from '@kobalte/core/text-field'
import { Dialog } from '@kobalte/core/dialog'
import { createModalSignal } from '../../../../../lib/createModalSignal.ts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'

const DEFAULT_PRIMARY_COLOR = '#E30E50'
const DEFAULT_ACCENT_COLOR = '#3584BF'

export const UserStylesSection: Component = () => {
  const query = useQuery(() => orpcPrivate.profile.getStyle.queryOptions())

  createEffect(on(() => query.data, console.log))

  return (
    <Show when={query.isSuccess}>
      <UserStyle
        primaryColor={query.data?.primaryColor || DEFAULT_PRIMARY_COLOR}
        accentColor={query.data?.accentColor || DEFAULT_ACCENT_COLOR}
      />
    </Show>
  )
}

interface UserStyleProps {
  primaryColor: string
  accentColor: string
}

export const UserStyle: Component<UserStyleProps> = (props) => {
  const [primaryColor, setPrimaryColor] = createSignal(props.primaryColor)
  const [accentColor, setAccentColor] = createSignal(props.accentColor)
  const modal = createModalSignal()
  const queryClient = useQueryClient()

  const updateStyle = useMutation(() =>
    orpcPrivate.profile.updateStyle.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: orpcPrivate.profile.getStyle.key(),
        }),
    }),
  )
  // Handle saving user styles
  const handleSaveStyles = async () => {
    try {
      updateStyle.mutate({
        primaryColor: primaryColor(),
        accentColor: accentColor(),
      })
      modal.close()
    } catch (error) {
      console.error('Error saving styles:', error)
    }
  }

  // Handle resetting colors to default
  const handleResetColors = () => {
    setPrimaryColor(DEFAULT_PRIMARY_COLOR)
    setAccentColor(DEFAULT_ACCENT_COLOR)
  }

  const onOpenChange = (v: boolean) => {
    console.log('onOpenChange', v)
    modal.setOpen(v)
    if (!v) {
      setPrimaryColor(props.primaryColor)
      setAccentColor(props.accentColor)
    }
  }

  return (
    <div class="mb-6 rounded-2xl bg-white p-6 shadow-xl">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-xl font-bold">User Style</h3>
        <button
          type="button"
          onClick={modal.open}
          class="rounded-lg bg-accent px-4 py-2 text-white transition-all hover:bg-accent-600"
          disabled={updateStyle.isPending}
        >
          {updateStyle.isPending ? 'Saving...' : 'Edit Colors'}
        </button>
      </div>

      {/* Error Message */}
      <Show when={updateStyle.isError}>
        <div class="mb-4 rounded-md bg-red-100 p-3 text-red-800">
          Error: {updateStyle.error?.message}
        </div>
      </Show>

      {/* Current Colors Display */}
      <div class="mt-4">
        <p class="mb-2 text-sm font-medium text-gray-700">Your Colors:</p>
        <div class="flex gap-4">
          <div class="flex flex-col items-center">
            <div
              class="h-16 w-16 rounded-lg shadow-md"
              style={{ 'background-color': primaryColor() }}
            ></div>
            <span class="mt-1 text-sm">Primary</span>
            <span class="text-xs text-gray-500">{primaryColor()}</span>
          </div>
          <div class="flex flex-col items-center">
            <div
              class="h-16 w-16 rounded-lg shadow-md"
              style={{ 'background-color': accentColor() }}
            ></div>
            <span class="mt-1 text-sm">Accent</span>
            <span class="text-xs text-gray-500">{accentColor()}</span>
          </div>
        </div>
      </div>

      {/* Edit Colors Dialog */}
      <Dialog open={modal.isOpen()} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
          <div class="fixed inset-0 z-50 flex items-center justify-center">
            <Dialog.Content class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <Dialog.Title class="mb-4 text-xl font-bold">
                Edit Your Colors
              </Dialog.Title>
              <Dialog.Description class="mb-4 text-gray-600">
                Choose your primary and accent colors for your profile.
              </Dialog.Description>

              <div class="space-y-4">
                <TextField value={primaryColor()} onChange={setPrimaryColor}>
                  <TextField.Label class="mb-1 block text-sm font-medium text-gray-700">
                    Primary Color
                  </TextField.Label>
                  <div class="flex items-center gap-2">
                    <div
                      class="h-8 w-8 rounded-md shadow-sm"
                      style={{ 'background-color': primaryColor() }}
                    ></div>
                    <TextField.Input
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="#E30E50"
                      type="color"
                    />
                  </div>
                  <TextField.Description class="mt-1 text-sm text-gray-500">
                    This color will be used as your primary brand color.
                  </TextField.Description>
                </TextField>

                <TextField value={accentColor()} onChange={setAccentColor}>
                  <TextField.Label class="mb-1 block text-sm font-medium text-gray-700">
                    Accent Color
                  </TextField.Label>
                  <div class="flex items-center gap-2">
                    <div
                      class="h-8 w-8 rounded-md shadow-sm"
                      style={{ 'background-color': accentColor() }}
                    ></div>
                    <TextField.Input
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="#3584BF"
                      type="color"
                    />
                  </div>
                  <TextField.Description class="mt-1 text-sm text-gray-500">
                    This color will be used as your accent color for highlights
                    and secondary elements.
                  </TextField.Description>
                </TextField>
              </div>

              <div class="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
                  onClick={modal.close}
                  disabled={updateStyle.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
                  onClick={handleResetColors}
                  disabled={updateStyle.isPending}
                >
                  Reset to Default
                </button>
                <button
                  type="button"
                  class="rounded-md bg-accent px-4 py-2 text-white hover:bg-accent-600"
                  onClick={handleSaveStyles}
                  disabled={updateStyle.isPending}
                >
                  {updateStyle.isPending ? 'Saving...' : 'Save Colors'}
                </button>
              </div>

              {/* Error Message */}
              <Show when={updateStyle.isError}>
                <div class="mt-4 rounded-md bg-red-100 p-3 text-sm text-red-800">
                  Error: {updateStyle.error?.message}
                </div>
              </Show>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog>
    </div>
  )
}
