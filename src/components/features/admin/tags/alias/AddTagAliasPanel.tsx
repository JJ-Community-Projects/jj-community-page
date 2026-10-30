import {type Component, createUniqueId, Show} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {createStore} from "solid-js/store";
import {Button} from "../../../../ui/Button";
import {Field, fieldClass} from "../../../../ui/Form";
import {Alert} from "../../../../ui/Status";
import {TileGroup} from "../../../../ui/Tile";
import {cn} from "../../../../ui/cn";

interface AddTagAliasPanelProps {
  tagId: number
}

export const AddTagAliasPanel: Component<AddTagAliasPanelProps> = (props) => {
  const id = createUniqueId()
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
    <TileGroup pad="md" class="flex flex-col gap-3">
      <h5 class="text-sm font-semibold">Add New Alias</h5>

      <form onSubmit={handleSubmit} class="flex flex-col gap-3">
        <div class="flex items-end gap-3">
          <Field label="Alias Name" for={id} class="min-w-0 flex-1">
            <input
              id={id}
              required
              placeholder="e.g., alternative name or abbreviation"
              class={cn(fieldClass.input, 'h-10')}
              value={tagAlias.alias}
              onInput={(e) => setTagAlias('alias', e.currentTarget.value)}
            />
          </Field>

          <Button
            type="submit"
            size="sm"
            variant="primary"
            class="mb-1"
            disabled={createTagAlias.isPending || !tagAlias.alias.trim()}
          >
            <Show when={createTagAlias.isPending} fallback="Add Alias">
              Adding...
            </Show>
          </Button>
        </div>

        <Show when={createTagAlias.error}>
          <Alert tone="danger">
            Error: {createTagAlias.error?.message || 'Failed to create alias'}
          </Alert>
        </Show>
      </form>
    </TileGroup>
  );
}
