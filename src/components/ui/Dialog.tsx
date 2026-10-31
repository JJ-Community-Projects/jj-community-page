import { type Component, createRenderEffect, type JSX, on, Show } from 'solid-js'
import { isServer } from 'solid-js/web'
import { Dialog as KDialog } from '@kobalte/core/dialog'
import { FaSolidXmark } from 'solid-icons/fa'
import { cn, dataBorder, dataColors, dataFill } from './cn'
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
  /** Header band and border in a data colour (e.g. a stream's), with a readable text colour. */
  accent?: string
  /** Fine print under the body (a notice, not buttons): muted, below a border, after `footer`. */
  aside?: JSX.Element
  children?: JSX.Element
}

export const Dialog: Component<DialogProps> = (props) => {
  // Kobalte returns focus to a Dialog.Trigger on close; these dialogs open from signals, so
  // remember what had focus when it opened (the clicked tile, row or button) and go back there.
  let opener: HTMLElement | undefined
  createRenderEffect(
    on(
      () => props.open,
      (open) => {
        if (open && !isServer) {
          opener = (document.activeElement as HTMLElement | null) ?? undefined
        }
      },
    ),
  )
  const returnFocus = (e: Event) => {
    if (opener?.isConnected && opener !== document.body) {
      e.preventDefault()
      opener.focus({ preventScroll: true })
    }
  }

  // Element props are read once, inside the portal (only while open), via Show's accessor:
  // reading them twice would create them twice and break hydration.
  return (
    <KDialog open={props.open} onOpenChange={props.onOpenChange}>
      <KDialog.Portal>
        <KDialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <KDialog.Content
            onCloseAutoFocus={returnFocus}
            class={cn(
              'rounded-tile bg-surface-strong text-fg shadow-tile-hover flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden',
              sizes[props.size ?? 'md'],
              props.accent && ['border-2', dataBorder],
            )}
            style={props.accent ? dataColors(props.accent) : undefined}
          >
            <div
              class={cn(
                'flex items-start gap-2 px-4 py-3',
                props.accent ? dataFill : 'border-line border-b',
              )}
            >
              <div class="min-w-0 flex-1">
                <KDialog.Title class="text-lg font-semibold">
                  {props.title}
                </KDialog.Title>
                <Show when={props.description}>
                  {(description) => (
                    <KDialog.Description
                      class={cn(
                        'text-sm',
                        props.accent ? 'opacity-90' : 'text-fg-muted',
                      )}
                    >
                      {description()}
                    </KDialog.Description>
                  )}
                </Show>
              </div>
              <KDialog.CloseButton
                as={IconButton}
                variant="ghost"
                size="sm"
                aria-label="Close"
                class={cn(
                  '-mr-1',
                  props.accent && 'text-current hover:bg-black/10',
                )}
              >
                <FaSolidXmark class="size-4" aria-hidden="true" />
              </KDialog.CloseButton>
            </div>
            <div class="overflow-y-auto px-4 py-3">{props.children}</div>
            <Show when={props.footer}>
              {(footer) => (
                <div class="border-line flex flex-wrap justify-end gap-2 border-t px-4 py-3">
                  {footer()}
                </div>
              )}
            </Show>
            <Show when={props.aside}>
              {(aside) => (
                <div class="border-line bg-surface text-fg-muted border-t px-4 py-2.5 text-xs">
                  {aside()}
                </div>
              )}
            </Show>
          </KDialog.Content>
        </div>
      </KDialog.Portal>
    </KDialog>
  )
}

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
