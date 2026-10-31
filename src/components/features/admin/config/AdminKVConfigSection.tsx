import {
  type Component,
  createEffect,
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  Show,
} from 'solid-js'
import { orpcPrivate } from '../../../../lib/orpc/client'
import { QueryComponent } from '../../../common/QueryComponent'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { Button } from '../../../ui/Button'
import { ConfirmDialog } from '../../../ui/Dialog'
import { Field, fieldClass } from '../../../ui/Form'
import { EmptyState, Spinner } from '../../../ui/Status'
import { cn, groupSurface } from '../../../ui/cn'

// AdminKVConfigSection
// - Debounced search by key using getKVValue
// - Create/update value using putKVValue
// - Delete key using deleteKVValue
// - List all keys using getAllKVKeys

export const AdminKVConfigSection: Component = () => {
  const keyId = createUniqueId()
  const valueId = createUniqueId()
  const [keyInput, setKeyInput] = createSignal('')
  const [debouncedKey, setDebouncedKey] = createSignal('')
  const [valueInput, setValueInput] = createSignal('')
  const [confirmDelete, setConfirmDelete] = createSignal(false)

  const qc = useQueryClient()

  // Debounce key input
  let timer: number | undefined
  createEffect(() => {
    const k = keyInput()
    if (timer) clearTimeout(timer)
    // @ts-ignore - window.setTimeout returns number in browser
    timer = setTimeout(() => setDebouncedKey(k.trim()), 350)
  })
  onCleanup(() => {
    if (timer) clearTimeout(timer)
  })

  // Query for KV value when debounced key is set
  const kvQuery = useQuery(() =>
    orpcPrivate.admin.getKVValue.queryOptions({
      input: { key: debouncedKey() },
      enabled: debouncedKey().length > 0,
      // When we successfully fetch, populate the editor value
      onSuccess: (data: { key: string; value: string }) => {
        // Only set if the debounced key still matches to avoid races
        if (data && data.key === debouncedKey()) {
          setValueInput(data.value)
        }
      },
      retry: false,
    }),
  )

  // Mutations
  const putMut = useMutation(() =>
    orpcPrivate.admin.putKVValue.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          qc.invalidateQueries({
            queryKey: orpcPrivate.admin.getAllKVKeys.queryKey(),
          }),
          debouncedKey()
            ? qc.invalidateQueries({
                queryKey: orpcPrivate.admin.getKVValue.queryKey({
                  input: { key: debouncedKey() },
                }),
              })
            : Promise.resolve(),
        ])
      },
    }),
  )

  const deleteMut = useMutation(() =>
    orpcPrivate.admin.deleteKVValue.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          qc.invalidateQueries({
            queryKey: orpcPrivate.admin.getAllKVKeys.queryKey(),
          }),
          debouncedKey()
            ? qc.invalidateQueries({
                queryKey: orpcPrivate.admin.getKVValue.queryKey({
                  input: { key: debouncedKey() },
                }),
              })
            : Promise.resolve(),
        ])
        setValueInput('')
      },
    }),
  )

  const onSave = () => {
    const k = keyInput().trim()
    if (!k) return
    putMut.mutate({ key: k, value: valueInput() })
  }

  const onDelete = () => {
    const k = keyInput().trim()
    if (!k) return
    setConfirmDelete(false)
    deleteMut.mutate({ key: k })
  }

  const selectKey = async (k: string) => {
    setKeyInput(k)
    setDebouncedKey(k)
    try {
      const data = await qc.fetchQuery(
        orpcPrivate.admin.getKVValue.queryOptions({
          input: { key: k },
        }),
      )
      setValueInput(data.value)
    } catch (e) {
      // Key not found or fetch failed; clear editor value
      setValueInput('')
    }
    // Also refetch the reactive query to keep cache and UI indicators in sync
    kvQuery.refetch()
  }

  return (
    <>
      {/* Editor */}
      <div class="flex flex-col gap-3">
        <Field label="Key" for={keyId}>
          <div class="flex items-center gap-2">
            <input
              id={keyId}
              class={cn(fieldClass.input, 'h-10 font-mono sm:max-w-sm')}
              value={keyInput()}
              onInput={(e) => setKeyInput(e.currentTarget.value)}
            />
            <Button size="sm" variant="ghost" onClick={() => setKeyInput('')}>
              Clear
            </Button>
          </div>
        </Field>
        <Field label="Value" for={valueId}>
          <textarea
            id={valueId}
            class={cn(fieldClass.input, 'min-h-20 py-2 font-mono')}
            value={valueInput()}
            onInput={(e) => setValueInput(e.currentTarget.value)}
          />
        </Field>
        <div class="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="accent"
            disabled={putMut.isPending}
            onClick={onSave}
          >
            {kvQuery.data ? 'Save' : 'Create'}
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={!keyInput().trim() || deleteMut.isPending}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </Button>
          <p class="text-fg-muted text-sm">
            <Show when={debouncedKey().length > 0}>
              <Show when={kvQuery.isLoading}>Searching…</Show>
              <Show when={kvQuery.isError && !kvQuery.isLoading}>
                No existing value for "{debouncedKey()}" — you can create it.
              </Show>
              <Show when={kvQuery.data && !kvQuery.isLoading}>
                Found existing value for "{debouncedKey()}".
              </Show>
            </Show>
          </p>
        </div>
      </div>

      {/* Keys list */}
      <div class="flex flex-col gap-2">
        <h3 class="font-semibold">All KV Keys</h3>
        <QueryComponent
          queryOptions={() => orpcPrivate.admin.getAllKVKeys.queryOptions()}
          loading={() => <Spinner label="Loading…" />}
        >
          {(keys) => (
            <Show
              when={keys.length > 0}
              fallback={<EmptyState title="No keys" />}
            >
              <ul class={cn(groupSurface, 'flex max-h-64 flex-col overflow-y-auto p-1')}>
                <For each={keys}>
                  {(k) => (
                    <li>
                      <button
                        type="button"
                        class="rounded-media flex w-full cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-left hover:bg-tint"
                        onClick={() => selectKey(k)}
                        title={k}
                      >
                        <span class="truncate font-mono text-xs">{k}</span>
                        <span class="text-accent-text text-xs font-semibold">select</span>
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          )}
        </QueryComponent>
      </div>

      <ConfirmDialog
        open={confirmDelete()}
        onOpenChange={setConfirmDelete}
        title="Delete KV key"
        text={<>Delete KV key "{keyInput().trim()}"?</>}
        confirmLabel="Delete"
        pending={deleteMut.isPending}
        onConfirm={onDelete}
      />
    </>
  )
}
