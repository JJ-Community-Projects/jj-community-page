import { type Component, createSignal, createUniqueId, For, Show } from 'solid-js'
import { orpcPrivate } from '../../../../lib/orpc/client'
import { QueryComponent } from '../../../common/QueryComponent'
import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { Button } from '../../../ui/Button'
import { ConfirmDialog } from '../../../ui/Dialog'
import { Checkbox, Field, fieldClass } from '../../../ui/Form'
import { Chip } from '../../../ui/Labels'
import { Select } from '../../../ui/Select'
import { EmptyState, Spinner } from '../../../ui/Status'
import { cn, groupSurface } from '../../../ui/cn'

// Simple Admin Config UI using oRPC private admin procedures and TanStack Query
// - Lists all configs (getAllConfigs)
// - Create configs for string/number/boolean
// - Remove configs
// - Shows different UI depending on config type

type ConfigType = 'string' | 'number' | 'boolean'

const valueInput = cn(fieldClass.input, 'h-10')

export const AdminConfigSection: Component = () => {
  const keyId = createUniqueId()
  const valueId = createUniqueId()
  const [keyInput, setKeyInput] = createSignal('')
  const [typeInput, setTypeInput] = createSignal<ConfigType>('string')
  const [stringValue, setStringValue] = createSignal('')
  const [numberValue, setNumberValue] = createSignal<number | ''>('')
  const [booleanValue, setBooleanValue] = createSignal(false)

  // Inline edit state
  const [editingKey, setEditingKey] = createSignal<string | null>(null)
  const [editStringValue, setEditStringValue] = createSignal('')
  const [editNumberValue, setEditNumberValue] = createSignal<number | ''>('')
  const [editBooleanValue, setEditBooleanValue] = createSignal(false)
  const [removingKey, setRemovingKey] = createSignal<string | null>(null)

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

  const toNumber = (value: string) => (value === '' ? '' : Number(value))

  return (
    <>
      <form class="flex flex-wrap items-end gap-3" onSubmit={onSubmit}>
        <Field label="Key" for={keyId} class="w-full sm:w-48">
          <input
            id={keyId}
            class={cn(valueInput, 'font-mono')}
            value={keyInput()}
            onInput={(e) => setKeyInput(e.currentTarget.value)}
          />
        </Field>
        <Select
          label="Type"
          showLabel
          options={['string', 'number', 'boolean'] as ConfigType[]}
          value={typeInput()}
          onChange={setTypeInput}
          format={(t) => t}
          class="pb-1"
        />
        <Show when={typeInput() === 'string'}>
          <Field label="Value" for={valueId} class="w-full sm:w-56">
            <input
              id={valueId}
              class={valueInput}
              value={stringValue()}
              onInput={(e) => setStringValue(e.currentTarget.value)}
            />
          </Field>
        </Show>
        <Show when={typeInput() === 'number'}>
          <Field label="Value" for={valueId} class="w-full sm:w-40">
            <input
              id={valueId}
              class={valueInput}
              type="number"
              value={numberValue()}
              onInput={(e) => setNumberValue(toNumber(e.currentTarget.value))}
            />
          </Field>
        </Show>
        <Show when={typeInput() === 'boolean'}>
          <Checkbox
            label={booleanValue() ? 'true' : 'false'}
            checked={booleanValue()}
            onChange={setBooleanValue}
            class="pb-2.5"
          />
        </Show>
        <Button
          type="submit"
          size="sm"
          variant="accent"
          class="mb-1"
          disabled={
            addStringMut.isPending ||
            addNumberMut.isPending ||
            addBooleanMut.isPending
          }
        >
          Add
        </Button>
      </form>

      <QueryComponent
        queryOptions={() => orpcPrivate.admin.getAllConfigs.queryOptions()}
        loading={() => <Spinner label="Loading…" />}
      >
        {(configs) => (
          <Show when={configs.length > 0} fallback={<EmptyState title="No configs" />}>
            <ul class={cn(groupSurface, 'divide-line flex flex-col divide-y')}>
              <For each={configs}>
                {(c) => (
                  <li class="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
                    <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span class="text-fg-muted font-mono text-sm">{c.key}</span>
                      <Chip size="sm">{c.type}</Chip>

                      <Show
                        when={editingKey() === c.key}
                        fallback={
                          <span class="max-w-75 truncate text-sm">
                            {c.type === 'boolean'
                              ? (((c as any).value as boolean) ? 'true' : 'false')
                              : String((c as any).value)}
                          </span>
                        }
                      >
                        <Show when={c.type === 'string'}>
                          <input
                            aria-label={`Value of ${c.key}`}
                            class={cn(fieldClass.input, 'h-8 w-56')}
                            value={editStringValue()}
                            onInput={(e) => setEditStringValue(e.currentTarget.value)}
                          />
                        </Show>
                        <Show when={c.type === 'number'}>
                          <input
                            aria-label={`Value of ${c.key}`}
                            class={cn(fieldClass.input, 'h-8 w-40')}
                            type="number"
                            value={editNumberValue()}
                            onInput={(e) => setEditNumberValue(toNumber(e.currentTarget.value))}
                          />
                        </Show>
                        <Show when={c.type === 'boolean'}>
                          <Checkbox
                            label={editBooleanValue() ? 'true' : 'false'}
                            checked={editBooleanValue()}
                            onChange={setEditBooleanValue}
                          />
                        </Show>
                      </Show>
                    </div>

                    <div class="flex items-center gap-2">
                      <Show
                        when={editingKey() === c.key}
                        fallback={
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingKey(c.key)
                                if (c.type === 'string') setEditStringValue((c as any).value as string)
                                if (c.type === 'number') setEditNumberValue((c as any).value as number)
                                if (c.type === 'boolean') setEditBooleanValue((c as any).value as boolean)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              class="text-danger-700"
                              onClick={() => setRemovingKey(c.key)}
                            >
                              Remove
                            </Button>
                          </>
                        }
                      >
                        <Button
                          size="sm"
                          variant="accent"
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
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>
                          Cancel
                        </Button>
                      </Show>
                    </div>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        )}
      </QueryComponent>

      <ConfirmDialog
        open={removingKey() !== null}
        onOpenChange={(open) => !open && setRemovingKey(null)}
        title="Remove config"
        text={<>Delete config "{removingKey()}"?</>}
        confirmLabel="Remove"
        pending={removeMut.isPending}
        onConfirm={() => {
          const key = removingKey()
          setRemovingKey(null)
          if (key) removeMut.mutate({ key })
        }}
      />
    </>
  )
}
