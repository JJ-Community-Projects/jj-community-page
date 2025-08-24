import {type Component, Show} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../lib/orpc/client.ts";
import {createStore} from "solid-js/store";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";

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
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Add New Tag Category</h3>

      <form onSubmit={handleSubmit} class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          {/* Slug */}
          <div>
            <TextField
              name="slug"
              value={category.slug}
              onChange={(value) => setCategory('slug', value)}
              required
            >
              <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </TextField.Label>
              <TextField.Input
                placeholder="e.g., gaming"
                pattern="^[a-z0-9-]+$"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </TextField>
          </div>

          {/* Name */}
          <div>
            <TextField
              name="name"
              value={category.name}
              onChange={(value) => setCategory('name', value)}
              required
            >
              <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                Name
              </TextField.Label>
              <TextField.Input
                placeholder="e.g., Gaming"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </TextField>
          </div>

          {/* Description */}
          <div class="md:col-span-2">
            <TextField
              name="description"
              value={category.description || ''}
              onChange={(value) => setCategory('description', value || null)}
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
              value={category.color}
              onInput={(e) => setCategory('color', e.currentTarget.value)}
              class="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Visibility and Submit */}
          <div class="flex items-center gap-3">
            <Checkbox
              checked={category.visible}
              onChange={(checked) => setCategory('visible', checked)}
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
              disabled={createTagCategory.isPending || !category.slug.trim() || !category.name.trim()}
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Show when={createTagCategory.isPending} fallback="Add Category">
                Adding...
              </Show>
            </button>
          </div>
        </div>

        <Show when={createTagCategory.error}>
          <div class="text-red-600 text-sm">
            Error: {createTagCategory.error?.message || 'Failed to create category'}
          </div>
        </Show>
      </form>
    </div>
  );
}
