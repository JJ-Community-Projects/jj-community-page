import { type Component, createSignal, createUniqueId, Show } from 'solid-js'
import { orpcPrivate } from '../../../lib/orpc/client'
import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { Button } from '../../ui/Button'
import { Field, fieldClass } from '../../ui/Form'
import { Alert } from '../../ui/Status'
import { TileGroup } from '../../ui/Tile'
import { cn } from '../../ui/cn'

export const AdminScheduleImportPanel: Component = () => {
  const qc = useQueryClient()
  const id = createUniqueId()
  const [text, setText] = createSignal('')
  const [message, setMessage] = createSignal<string | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  const importSchedule = useMutation(() =>
    orpcPrivate.admin.importSchedule.mutationOptions({
      onSuccess: async () => {
        setMessage('Import successful')
        setError(null)
        setText('')
        await qc.invalidateQueries({ queryKey: orpcPrivate.admin.getAllSchedules.queryKey() })
      },
      onError: (e: any) => {
        console.error(e)
        setMessage(null)
        setError(e?.message ?? 'Import failed')
      },
    }),
  )

  const handleImport = async () => {
    setMessage(null)
    setError(null)
    const value = text().trim()
    if (!value) {
      setError('Please paste a schedule JSON first')
      return
    }
    try {
      await importSchedule.mutateAsync({ json: value })
    } catch (e) {
      // handled in onError
    }
  }

  return (
    <TileGroup pad="md" class="flex flex-col gap-3">
      <h3 class="font-semibold">Import Schedule</h3>
      <Field
        label="Schedule JSON"
        for={id}
        description="Paste a JSON export produced by the Export button and click Import."
      >
        <textarea
          id={id}
          class={cn(fieldClass.input, 'min-h-40 py-2 font-mono')}
          placeholder="Paste schedule JSON here"
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          disabled={importSchedule.isPending}
        ></textarea>
      </Field>
      <Button
        size="sm"
        variant="primary"
        class="self-start"
        onClick={handleImport}
        disabled={importSchedule.isPending}
      >
        {importSchedule.isPending ? 'Importing…' : 'Import'}
      </Button>
      <Show when={message()}>
        <Alert tone="success">{message()}</Alert>
      </Show>
      <Show when={error()}>
        <Alert tone="danger">{error()}</Alert>
      </Show>
    </TileGroup>
  )
}
