import {type Component, Show} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {createStore} from "solid-js/store";
import {Button} from "../../../../ui/Button";
import {Alert} from "../../../../ui/Status";
import {nestedSurface, TagFormFields} from "../common/TagFormFields.tsx";
import {cn} from "../../../../ui/cn";

interface AddTagPanelProps {
  categoryId: number
}

export const AddTagPanel: Component<AddTagPanelProps> = (props) => {
  const client = useQueryClient()
  const createTag = useMutation(() =>
    orpcPrivate.adminTags.createTag.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: orpcPrivate.adminTags.getTagsWithUsageAndAliasesByCategory.key()
        })
        // Reset form after successful submission
        setTag({
          name: '',
          slug: '',
          description: '',
          color: '#3584BF',
          visible: true,
        })
      }
    })
  )

  const [tag, setTag] = createStore<{
    name: string
    slug: string
    description: string | null
    color: string
    visible: boolean
  }>({
    name: '',
    slug: '',
    description: '',
    color: '#3584BF',
    visible: true,
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()

    // Basic validation
    if (!tag.name.trim() || !tag.slug.trim()) {
      return
    }

    createTag.mutate({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || undefined,
      categoryId: props.categoryId,
      color: tag.color,
      visible: tag.visible,
    })
  }

  return (
    <div class={cn(nestedSurface, 'flex flex-col gap-3')}>
      <h4 class="font-semibold">Add New Tag</h4>

      <form onSubmit={handleSubmit} class="flex flex-col gap-3">
        <TagFormFields
          draft={tag}
          onChange={(patch) => setTag(patch)}
          namePlaceholder="e.g., Minecraft"
          slugPlaceholder="e.g., minecraft"
        />

        <Button
          type="submit"
          size="sm"
          variant="primary"
          class="self-start"
          disabled={createTag.isPending || !tag.name.trim() || !tag.slug.trim()}
        >
          <Show when={createTag.isPending} fallback="Add Tag">
            Adding...
          </Show>
        </Button>

        <Show when={createTag.error}>
          <Alert tone="danger">
            Error: {createTag.error?.message || 'Failed to create tag'}
          </Alert>
        </Show>
      </form>
    </div>
  );
}
