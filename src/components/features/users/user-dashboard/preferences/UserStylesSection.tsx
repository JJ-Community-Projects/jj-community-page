import { type Component, createSignal, Show } from 'solid-js'
import { TextField } from '@kobalte/core/text-field'
import { FaSolidPalette } from 'solid-icons/fa'
import { createModalSignal } from '../../../../../lib/createModalSignal.ts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { Section } from '../../../../ui/Tile'
import { Button } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { fieldClass } from '../../../../ui/Form'
import { Alert } from '../../../../ui/Status'

const DEFAULT_PRIMARY_COLOR = '#E30E50'
const DEFAULT_ACCENT_COLOR = '#3584BF'

export const UserStylesSection: Component = () => {
  const query = useQuery(() => orpcPrivate.profile.getStyle.queryOptions())

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

const Swatch: Component<{ label: string; color: string }> = (props) => (
  <div class="flex flex-col items-center gap-0.5">
    <div
      class="rounded-media size-14 ring-1 ring-black/10"
      style={{ 'background-color': props.color }}
    />
    <span class="text-sm font-semibold">{props.label}</span>
    <span class="text-fg-muted text-xs">{props.color}</span>
  </div>
)

const ColorField: Component<{
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  description: string
}> = (props) => (
  <TextField
    value={props.value}
    onChange={props.onChange}
    class="flex flex-col gap-1"
  >
    <TextField.Label class={fieldClass.label}>{props.label}</TextField.Label>
    <TextField.Input
      class="rounded-group ring-line-strong bg-surface-strong h-10 w-full cursor-pointer p-1 ring-1"
      placeholder={props.placeholder}
      type="color"
    />
    <TextField.Description class={fieldClass.help}>
      {props.description}
    </TextField.Description>
  </TextField>
)

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
  // Close only once saved; on failure the dialog stays open with the error
  const handleSaveStyles = async () => {
    try {
      await updateStyle.mutateAsync({
        primaryColor: primaryColor(),
        accentColor: accentColor(),
      })
      modal.close()
    } catch (error) {
      console.error('Error saving styles:', error)
    }
  }

  const handleResetColors = () => {
    setPrimaryColor(DEFAULT_PRIMARY_COLOR)
    setAccentColor(DEFAULT_ACCENT_COLOR)
  }

  const onOpenChange = (v: boolean) => {
    modal.setOpen(v)
    if (!v) {
      // Closed without saving: drop the edits and any failed save's error
      setPrimaryColor(props.primaryColor)
      setAccentColor(props.accentColor)
      updateStyle.reset()
    }
  }

  return (
    <Section
      title="User Style"
      icon={<FaSolidPalette />}
      action={
        <Button
          variant="accent"
          size="sm"
          onClick={modal.open}
          disabled={updateStyle.isPending}
        >
          {updateStyle.isPending ? 'Saving...' : 'Edit Colors'}
        </Button>
      }
    >
      <Show when={updateStyle.isError}>
        <Alert tone="danger" class="mb-3">
          Error: {updateStyle.error?.message}
        </Alert>
      </Show>

      <p class="text-fg-muted mb-2 text-sm">Your Colors:</p>
      <div class="flex gap-4">
        <Swatch label="Primary" color={primaryColor()} />
        <Swatch label="Accent" color={accentColor()} />
      </div>

      <Dialog
        open={modal.isOpen()}
        onOpenChange={onOpenChange}
        title="Edit Your Colors"
        description="Choose your primary and accent colors for your profile."
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              class="mr-auto"
              onClick={handleResetColors}
              disabled={updateStyle.isPending}
            >
              Reset to Default
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={updateStyle.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="accent"
              onClick={handleSaveStyles}
              disabled={updateStyle.isPending}
            >
              {updateStyle.isPending ? 'Saving...' : 'Save Colors'}
            </Button>
          </>
        }
      >
        <div class="flex flex-col gap-4">
          <ColorField
            label="Primary Color"
            value={primaryColor()}
            onChange={setPrimaryColor}
            placeholder={DEFAULT_PRIMARY_COLOR}
            description="Your main profile colour, used for your tags."
          />
          <ColorField
            label="Accent Color"
            value={accentColor()}
            onChange={setAccentColor}
            placeholder={DEFAULT_ACCENT_COLOR}
            description="Your accent colour, used for highlights such as the avatar ring."
          />
          <Show when={updateStyle.isError}>
            <Alert tone="danger">Error: {updateStyle.error?.message}</Alert>
          </Show>
        </div>
      </Dialog>
    </Section>
  )
}
