import { type Component, type JSX, Show } from 'solid-js'
import { Dialog as KDialog } from '@kobalte/core/dialog'
import { FaSolidXmark } from 'solid-icons/fa'
import { cn } from './cn'
import { Button, IconButton } from './Button'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-3xl',
}

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: JSX.Element
  size?: keyof typeof sizes
  /** Buttons, right-aligned below the body. */
  footer?: JSX.Element
  children?: JSX.Element
}

export const Dialog: Component<DialogProps> = (props) => (
  <KDialog open={props.open} onOpenChange={props.onOpenChange}>
    <KDialog.Portal>
      <KDialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <KDialog.Content
          class={cn(
            'rounded-tile bg-surface-strong text-fg shadow-tile-hover flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden',
            sizes[props.size ?? 'md'],
          )}
        >
          <div class="border-line flex items-start gap-2 border-b px-4 py-3">
            <div class="min-w-0 flex-1">
              <KDialog.Title class="text-lg font-semibold">
                {props.title}
              </KDialog.Title>
              <Show when={props.description}>
                <KDialog.Description class="text-fg-muted text-sm">
                  {props.description}
                </KDialog.Description>
              </Show>
            </div>
            <KDialog.CloseButton
              as={IconButton}
              variant="ghost"
              size="sm"
              aria-label="Close"
              class="-mr-1"
            >
              <FaSolidXmark class="size-4" aria-hidden="true" />
            </KDialog.CloseButton>
          </div>
          <div class="overflow-y-auto px-4 py-3">{props.children}</div>
          <Show when={props.footer}>
            <div class="border-line flex flex-wrap justify-end gap-2 border-t px-4 py-3">
              {props.footer}
            </div>
          </Show>
        </KDialog.Content>
      </div>
    </KDialog.Portal>
  </KDialog>
)

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  text: JSX.Element
  onConfirm: () => void
  /** Called on Cancel; closing the dialog is enough when unset. */
  onCancel?: () => void
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` for deleting, leaving, blocking. */
  tone?: 'danger' | 'primary'
  /** Disables the buttons while the confirmed action runs. */
  pending?: boolean
}

export const ConfirmDialog: Component<ConfirmDialogProps> = (props) => (
  <Dialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title={props.title}
    size="sm"
    footer={
      <>
        <Button
          size="sm"
          disabled={props.pending}
          onClick={() =>
            props.onCancel ? props.onCancel() : props.onOpenChange(false)
          }
        >
          {props.cancelLabel ?? 'Cancel'}
        </Button>
        <Button
          size="sm"
          variant={props.tone === 'primary' ? 'primary' : 'danger'}
          disabled={props.pending}
          onClick={() => props.onConfirm()}
        >
          {props.confirmLabel ?? 'Confirm'}
        </Button>
      </>
    }
  >
    <p class="text-sm">{props.text}</p>
  </Dialog>
)
