import {type Component, Show} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../lib/orpc/client.ts";
import {createStore} from "solid-js/store";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";

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
    <div class="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
      <h4 class="text-md font-medium text-gray-900 mb-3">Add New Tag</h4>

      <form onSubmit={handleSubmit} class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Name */}
          <div>
            <TextField
              name="name"
              value={tag.name}
              onChange={(value) => setTag('name', value)}
              required
            >
              <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                Name
              </TextField.Label>
              <TextField.Input
                placeholder="e.g., Minecraft"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </TextField>
          </div>

          {/* Slug */}
          <div>
            <TextField
              name="slug"
              value={tag.slug}
              onChange={(value) => setTag('slug', value)}
              required
            >
              <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </TextField.Label>
              <TextField.Input
                placeholder="e.g., minecraft"
                pattern="^[a-z0-9-]+$"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </TextField>
          </div>

          {/* Description */}
          <div>
            <TextField
              name="description"
              value={tag.description || ''}
              onChange={(value) => setTag('description', value || null)}
            >
              <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                Description
              </TextField.Label>
              <TextField.Input
                placeholder="Optional description"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </TextField>
          </div>

          {/* Color */}
          <div>
            <label for="color" class="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              id="color"
              type="color"
              value={tag.color}
              onInput={(e) => setTag('color', e.currentTarget.value)}
              class="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Visibility and Submit */}
          <div class="flex items-center gap-3">
            <Checkbox
              checked={tag.visible}
              onChange={(checked) => setTag('visible', checked)}
              class="flex items-center"
            >
              <Checkbox.Input class="sr-only" />
              <Checkbox.Control class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 border border-gray-300 rounded bg-white flex items-center justify-center">
                <Checkbox.Indicator>
                  <svg class="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label class="ml-2 text-sm text-gray-700">Visible</Checkbox.Label>
            </Checkbox>

            <button
              type="submit"
              disabled={createTag.isPending || !tag.name.trim() || !tag.slug.trim()}
              class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Show when={createTag.isPending} fallback="Add Tag">
                Adding...
              </Show>
            </button>
          </div>
        </div>

        <Show when={createTag.error}>
          <div class="text-red-600 text-sm">
            Error: {createTag.error?.message || 'Failed to create tag'}
          </div>
        </Show>
      </form>
    </div>
  );
}
