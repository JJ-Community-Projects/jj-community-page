import { type Component, createSignal, Show } from 'solid-js'
import { orpcPrivate } from '../../../lib/orpc/client'
import { useMutation, useQueryClient } from '@tanstack/solid-query'

export const AdminScheduleImportPanel: Component = () => {
  const qc = useQueryClient()
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
    <div class="mt-4 p-4 border border-gray-200 rounded">
      <h3 class="text-lg font-semibold mb-2">Import Schedule</h3>
      <p class="text-sm text-gray-600 mb-3">Paste a JSON export produced by the Export button and click Import.</p>
      <textarea
        class="w-full min-h-[160px] p-2 border rounded font-mono text-sm"
        placeholder="Paste schedule JSON here"
        value={text()}
        onInput={(e) => setText(e.currentTarget.value)}
        disabled={importSchedule.isPending}
      ></textarea>
      <div class="mt-3 flex items-center gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 text-xs disabled:opacity-50"
          onClick={handleImport}
          disabled={importSchedule.isPending}
        >
          {importSchedule.isPending ? 'Importing…' : 'Import'}
        </button>
        <Show when={message()}>
          <span class="text-xs text-green-700">{message()}</span>
        </Show>
        <Show when={error()}>
          <span class="text-xs text-red-600">{error()}</span>
        </Show>
      </div>
    </div>
  )
}
