import {
  type Component,
  createEffect,
  createSignal,
  For,
  onCleanup,
  Show,
} from 'solid-js'
import { orpcPrivate } from '../../../../lib/orpc/client'
import { QueryComponent } from '../../../common/QueryComponent'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'

// AdminKVConfigSection
// - Debounced search by key using getKVValue
// - Create/update value using putKVValue
// - Delete key using deleteKVValue
// - List all keys using getAllKVKeys

export const AdminKVConfigSection: Component = () => {
  const [keyInput, setKeyInput] = createSignal('')
  const [debouncedKey, setDebouncedKey] = createSignal('')
  const [valueInput, setValueInput] = createSignal('')

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
    if (!confirm(`Delete KV key "${k}"?`)) return
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
    <section class="space-y-4 rounded-md border bg-white p-4 shadow-md">
      <h2 class="text-lg font-semibold">Admin KV Config</h2>

      {/* Editor */}
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <input
            class="input input-bordered w-64 rounded border px-2 py-1"
            placeholder="key"
            value={keyInput()}
            onInput={(e) => setKeyInput(e.currentTarget.value)}
          />
          <button
            class="rounded border px-2 py-1"
            onClick={() => setKeyInput('')}
          >
            clear
          </button>
        </div>
        <div class="flex items-start gap-2">
          <textarea
            class="textarea textarea-bordered min-h-[80px] w-full rounded border px-2 py-1 font-mono"
            placeholder="value"
            value={valueInput()}
            onInput={(e) => setValueInput(e.currentTarget.value)}
          />
          <div class="flex flex-col gap-2">
            <button
              class="btn rounded border bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
              disabled={putMut.isPending}
              onClick={onSave}
            >
              {kvQuery.data ? 'Save' : 'Create'}
            </button>
            <button
              class="btn rounded border border-red-300 px-3 py-1 text-red-700 disabled:opacity-50"
              disabled={!keyInput().trim() || deleteMut.isPending}
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        </div>

        <div class="text-sm text-gray-600">
          <Show when={debouncedKey().length > 0}>
            <Show when={kvQuery.isLoading}>Searching…</Show>
            <Show when={kvQuery.isError && !kvQuery.isLoading}>
              No existing value for "{debouncedKey()}" — you can create it.
            </Show>
            <Show when={kvQuery.data && !kvQuery.isLoading}>
              Found existing value for "{debouncedKey()}".
            </Show>
          </Show>
        </div>
      </div>

      {/* Keys list */}
      <div class="mt-4">
        <h3 class="text-md mb-2 font-semibold">All KV Keys</h3>
        <QueryComponent
          queryOptions={() => orpcPrivate.admin.getAllKVKeys.queryOptions()}
        >
          {(keys) => (
            <div class="flex max-h-64 flex-col gap-1 overflow-auto rounded border bg-gray-50 p-2">
              <Show
                when={keys.length > 0}
                fallback={<div class="text-sm text-gray-500">No keys</div>}
              >
                <For each={keys}>
                  {(k) => (
                    <button
                      class="flex w-full items-center justify-between rounded border bg-white px-2 py-1 text-left hover:bg-gray-100"
                      onClick={() => selectKey(k)}
                      title={k}
                    >
                      <span class="truncate font-mono text-xs text-gray-700">
                        {k}
                      </span>
                      <span class="text-xs text-blue-600">select</span>
                    </button>
                  )}
                </For>
              </Show>
            </div>
          )}
        </QueryComponent>
      </div>
    </section>
  )
}
