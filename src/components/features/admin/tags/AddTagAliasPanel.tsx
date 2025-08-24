import {type Component, Show} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../lib/orpc/client.ts";
import {createStore} from "solid-js/store";
import {TextField} from "@kobalte/core/text-field";

interface AddTagAliasPanelProps {
  tagId: number
}

export const AddTagAliasPanel: Component<AddTagAliasPanelProps> = (props) => {
  const client = useQueryClient()
  const createTagAlias = useMutation(() =>
    orpcPrivate.adminTags.addTagAlias.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: orpcPrivate.adminTags.getTagAliases.key()
        })
        // Reset form after successful submission
        setTagAlias({
          alias: '',
        })
      }
    })
  )

  const [tagAlias, setTagAlias] = createStore<{
    alias: string
  }>({
    alias: '',
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()

    // Basic validation
    if (!tagAlias.alias.trim()) {
      return
    }

    createTagAlias.mutate({
      tagId: props.tagId,
      alias: tagAlias.alias.trim(),
    })
  }

  return (
    <div class="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
      <h4 class="text-md font-medium text-gray-900 mb-3">Add New Alias</h4>

      <form onSubmit={handleSubmit} class="space-y-4">
        <div class="flex gap-4 items-end">
          {/* Alias */}
          <div class="flex-1">
            <TextField
              name="alias"
              value={tagAlias.alias}
              onChange={(value) => setTagAlias('alias', value)}
              required
            >
              <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                Alias Name
              </TextField.Label>
              <TextField.Input
                placeholder="e.g., alternative name or abbreviation"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </TextField>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={createTagAlias.isPending || !tagAlias.alias.trim()}
              class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Show when={createTagAlias.isPending} fallback="Add Alias">
                Adding...
              </Show>
            </button>
          </div>
        </div>

        <Show when={createTagAlias.error}>
          <div class="text-red-600 text-sm">
            Error: {createTagAlias.error?.message || 'Failed to create alias'}
          </div>
        </Show>
      </form>
    </div>
  );
}
