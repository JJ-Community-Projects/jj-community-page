import { type Component, createSignal, For, Show } from 'solid-js'
import { orpcPrivate } from '../../../../lib/orpc/client'
import { QueryComponent } from '../../../common/QueryComponent'
import { useMutation, useQueryClient } from '@tanstack/solid-query'

// Simple Admin Config UI using oRPC private admin procedures and TanStack Query
// - Lists all configs (getAllConfigs)
// - Create configs for string/number/boolean
// - Remove configs
// - Shows different UI depending on config type

export const AdminConfigSection: Component = () => {
  const [keyInput, setKeyInput] = createSignal('')
  const [typeInput, setTypeInput] = createSignal<
    'string' | 'number' | 'boolean'
  >('string')
  const [stringValue, setStringValue] = createSignal('')
  const [numberValue, setNumberValue] = createSignal<number | ''>('')
  const [booleanValue, setBooleanValue] = createSignal(false)

  // Inline edit state
  const [editingKey, setEditingKey] = createSignal<string | null>(null)
  const [editStringValue, setEditStringValue] = createSignal('')
  const [editNumberValue, setEditNumberValue] = createSignal<number | ''>('')
  const [editBooleanValue, setEditBooleanValue] = createSignal(false)

  const qc = useQueryClient()

  // Mutations
  const addStringMut = useMutation(() =>
    orpcPrivate.admin.addStringConfig.mutationOptions({
      onSuccess: async () => {
        await qc.invalidateQueries({
          queryKey: orpcPrivate.admin.getAllConfigs.queryKey(),
        })
        setKeyInput('')
        setStringValue('')
        setEditingKey(null)
      },
    }),
  )

  const addNumberMut = useMutation(() =>
    orpcPrivate.admin.addNumberConfig.mutationOptions({
      onSuccess: async () => {
        await qc.invalidateQueries({
          queryKey: orpcPrivate.admin.getAllConfigs.queryKey(),
        })
        setKeyInput('')
        setNumberValue('')
        setEditingKey(null)
      },
    }),
  )

  const addBooleanMut = useMutation(() =>
    orpcPrivate.admin.addBooleanConfig.mutationOptions({
      onSuccess: async () => {
        await qc.invalidateQueries({
          queryKey: orpcPrivate.admin.getAllConfigs.queryKey(),
        })
        setKeyInput('')
        setBooleanValue(false)
        setEditingKey(null)
      },
    }),
  )

  const removeMut = useMutation(() =>
    orpcPrivate.admin.removeConfigContract.mutationOptions({
      onSuccess: async () => {
        await qc.invalidateQueries({
          queryKey: orpcPrivate.admin.getAllConfigs.queryKey(),
        })
      },
    }),
  )

  const onSubmit = (e: Event) => {
    e.preventDefault()
    const key = keyInput().trim()
    if (!key) return
    const t = typeInput()
    if (t === 'string') {
      const v = stringValue()
      if (v === '') return
      addStringMut.mutate({ key, value: v })
    } else if (t === 'number') {
      const v = numberValue()
      if (v === '' || Number.isNaN(v)) return
      addNumberMut.mutate({ key, value: Number(v) })
    } else {
      addBooleanMut.mutate({ key, value: booleanValue() })
    }
  }

  return (
    <section class="space-y-4 rounded-md border p-4 bg-white shadow-md">
      <h2 class="text-lg font-semibold">Admin Configs</h2>

      <form class="flex flex-col gap-2" onSubmit={onSubmit}>
        <div class="flex items-center gap-2">
          <input
            class="input input-bordered w-48 rounded border px-2 py-1"
            placeholder="key"
            value={keyInput()}
            onInput={(e) => setKeyInput(e.currentTarget.value)}
          />
          <select
            class="select rounded border px-2 py-1"
            value={typeInput()}
            onChange={(e) => setTypeInput(e.currentTarget.value as any)}
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
          </select>
          <Show when={typeInput() === 'string'}>
            <input
              class="input input-bordered w-56 rounded border px-2 py-1"
              placeholder="value"
              value={stringValue()}
              onInput={(e) => setStringValue(e.currentTarget.value)}
            />
          </Show>
          <Show when={typeInput() === 'number'}>
            <input
              class="input input-bordered w-40 rounded border px-2 py-1"
              placeholder="number"
              type="number"
              value={numberValue() as any}
              onInput={(e) =>
                setNumberValue(
                  e.currentTarget.value === ''
                    ? ''
                    : Number(e.currentTarget.value),
                )
              }
            />
          </Show>
          <Show when={typeInput() === 'boolean'}>
            <label class="flex items-center gap-1">
              <input
                type="checkbox"
                checked={booleanValue()}
                onChange={(e) => setBooleanValue(e.currentTarget.checked)}
              />
              <span>{booleanValue() ? 'true' : 'false'}</span>
            </label>
          </Show>
          <button
            type="submit"
            class="btn rounded border bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
            disabled={
              addStringMut.isPending ||
              addNumberMut.isPending ||
              addBooleanMut.isPending
            }
          >
            Add
          </button>
        </div>
      </form>

      <QueryComponent
        queryOptions={() => orpcPrivate.admin.getAllConfigs.queryOptions()}
      >
        {(configs) => (
          <div class="flex flex-col gap-2">
            <For each={configs}>
              {(c) => (
                <div class="flex items-center justify-between rounded border p-2">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm text-gray-600">{c.key}</span>
                    <span class="rounded border bg-gray-100 px-2 py-0.5 text-xs">
                      {c.type}
                    </span>

                    <Show when={editingKey() !== c.key}>
                      <>
                        <Show when={c.type === 'string'}>
                          <span class="max-w-[300px] truncate">
                            {(c as any).value as string}
                          </span>
                        </Show>
                        <Show when={c.type === 'number'}>
                          <span>{(c as any).value as number}</span>
                        </Show>
                        <Show when={c.type === 'boolean'}>
                          <span>
                            {((c as any).value as boolean) ? 'true' : 'false'}
                          </span>
                        </Show>
                      </>
                    </Show>

                    <Show when={editingKey() === c.key}>
                      <>
                        <Show when={c.type === 'string'}>
                          <input
                            class="input input-bordered w-56 rounded border px-2 py-1"
                            value={editStringValue()}
                            onInput={(e) => setEditStringValue(e.currentTarget.value)}
                          />
                        </Show>
                        <Show when={c.type === 'number'}>
                          <input
                            class="input input-bordered w-40 rounded border px-2 py-1"
                            type="number"
                            value={editNumberValue() as any}
                            onInput={(e) =>
                              setEditNumberValue(
                                e.currentTarget.value === ''
                                  ? ''
                                  : Number(e.currentTarget.value),
                              )
                            }
                          />
                        </Show>
                        <Show when={c.type === 'boolean'}>
                          <label class="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={editBooleanValue()}
                              onChange={(e) => setEditBooleanValue(e.currentTarget.checked)}
                            />
                            <span>{editBooleanValue() ? 'true' : 'false'}</span>
                          </label>
                        </Show>
                      </>
                    </Show>
                  </div>

                  <div class="flex items-center gap-2">
                    <Show when={editingKey() !== c.key}>
                      <>
                        <button
                          class="rounded border px-2 py-1"
                          onClick={() => {
                            setEditingKey(c.key)
                            if (c.type === 'string') setEditStringValue((c as any).value as string)
                            if (c.type === 'number') setEditNumberValue((c as any).value as number)
                            if (c.type === 'boolean') setEditBooleanValue((c as any).value as boolean)
                          }}
                        >
                          edit
                        </button>
                        <button
                          class="rounded border border-red-300 px-2 py-1 text-red-700"
                          onClick={() => {
                            if (!confirm(`Delete config "${c.key}"?`)) return
                            removeMut.mutate({ key: c.key })
                          }}
                        >
                          remove
                        </button>
                      </>
                    </Show>

                    <Show when={editingKey() === c.key}>
                      <>
                        <button
                          class="rounded border bg-green-600 text-white px-2 py-1 disabled:opacity-50"
                          onClick={() => {
                            if (c.type === 'string') {
                              const v = editStringValue()
                              if (v === '') return
                              addStringMut.mutate({ key: c.key, value: v })
                            } else if (c.type === 'number') {
                              const v = editNumberValue()
                              if (v === '' || Number.isNaN(v)) return
                              addNumberMut.mutate({ key: c.key, value: Number(v) })
                            } else {
                              addBooleanMut.mutate({ key: c.key, value: editBooleanValue() })
                            }
                          }}
                        >
                          save
                        </button>
                        <button
                          class="rounded border px-2 py-1"
                          onClick={() => setEditingKey(null)}
                        >
                          cancel
                        </button>
                      </>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        )}
      </QueryComponent>
    </section>
  )
}
