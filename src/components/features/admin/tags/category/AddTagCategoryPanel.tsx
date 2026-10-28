import {type Component, Show} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {createStore} from "solid-js/store";
import {Button} from "../../../../ui/Button";
import {Alert} from "../../../../ui/Status";
import {TileGroup} from "../../../../ui/Tile";
import {TagFormFields} from "../common/TagFormFields.tsx";

export const AddTagCategoryPanel: Component = () => {
  const client = useQueryClient()
  const createTagCategory = useMutation(() =>
    orpcPrivate.adminTags.createTagCategory.mutationOptions(({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: orpcPrivate.adminTags.getAllTagCategories.key()
        })
        // Reset form after successful submission
        setCategory({
          slug: '',
          name: '',
          description: '',
          color: '#6B7280',
          icon: '',
          visible: true,
        })
      }
    }))
  )


  const [category, setCategory] = createStore<{
    slug: string
    name: string
    description: string | null
    color: string
    icon: string | null
    visible: boolean
  }>({
    slug: '',
    name: '',
    description: '',
    color: '#6B7280',
    icon: '',
    visible: true,
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()

    // Basic validation
    if (!category.slug.trim() || !category.name.trim()) {
      return
    }

    createTagCategory.mutate({
      slug: category.slug,
      name: category.name,
      description: category.description || undefined,
      color: category.color,
      icon: category.icon || undefined,
      visible: category.visible,
    })
  }

  return (
    <TileGroup pad="md" class="flex flex-col gap-3">
      <h3 class="font-semibold">Add New Tag Category</h3>

      <form onSubmit={handleSubmit} class="flex flex-col gap-3">
        <TagFormFields
          draft={category}
          onChange={(patch) => setCategory(patch)}
          namePlaceholder="e.g., Gaming"
          slugPlaceholder="e.g., gaming"
        />

        <Button
          type="submit"
          size="sm"
          variant="primary"
          class="self-start"
          disabled={createTagCategory.isPending || !category.slug.trim() || !category.name.trim()}
        >
          <Show when={createTagCategory.isPending} fallback="Add Category">
            Adding...
          </Show>
        </Button>

        <Show when={createTagCategory.error}>
          <Alert tone="danger">
            Error: {createTagCategory.error?.message || 'Failed to create category'}
          </Alert>
        </Show>
      </form>
    </TileGroup>
  );
}
