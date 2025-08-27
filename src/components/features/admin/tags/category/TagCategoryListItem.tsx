import {type Component, createSignal, Show} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {createStore} from "solid-js/store";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";
import {TagSection} from "../tag/TagSection.tsx";

interface TagCategoryListItemProps {
  category: {
    id: number
    slug: string
    name: string
    description: string | null
    color: string
    icon: string | null
    sortOrder: number
    visible: boolean
    createdBy: number
    createdAt: Date
    updatedAt: Date
    tagCount: number
    userUsage: number
    streamUsage: number
  }
}

export const TagCategoryListItem: Component<TagCategoryListItemProps> = (props) => {
  const category = props.category;
  const client = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [expanded, setExpanded] = createSignal(false);

  const updateCategory = useMutation(() =>
    orpcPrivate.adminTags.updateTagCategory.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: orpcPrivate.adminTags.getAllTagCategories.key()
        })
      }
    })
  )

  const deleteCategory = useMutation(() =>
    orpcPrivate.adminTags.deleteTagCategory.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: orpcPrivate.adminTags.getAllTagCategories.key()
        })
      }
    })
  )

  const [editableCategory, setEditableCategory] = createStore<{
    slug: string
    name: string
    description: string | null
    color: string
    icon: string | null
    visible: boolean
  }>({
    slug: category.slug,
    name: category.name,
    description: category.description,
    color: category.color,
    icon: category.icon,
    visible: category.visible,
  })

  const handleUpdate = (e: Event) => {
    e.preventDefault()

    // Basic validation
    if (!editableCategory.slug.trim() || !editableCategory.name.trim()) {
      return
    }

    updateCategory.mutate({
      id: category.id,
      slug: editableCategory.slug,
      name: editableCategory.name,
      description: editableCategory.description || undefined,
      color: editableCategory.color,
      icon: editableCategory.icon || undefined,
      visible: editableCategory.visible,
    })
  }

  const handleDelete = () => {
    if (showDeleteConfirm()) {
      deleteCategory.mutate({
        id: category.id
      })
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
    }
  }

  const hasChanges = () => {
    return (
      editableCategory.slug !== category.slug ||
      editableCategory.name !== category.name ||
      editableCategory.description !== category.description ||
      editableCategory.color !== category.color ||
      editableCategory.icon !== category.icon ||
      editableCategory.visible !== category.visible
    )
  }

  return (
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded())}
            class="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg
              class={`w-5 h-5 transition-transform ${expanded() ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <h4 class="text-lg font-medium text-gray-900">
            {category.name} ({category.tagCount} tags, {category.userUsage + category.streamUsage} uses)
          </h4>
        </div>
        <div class="flex items-center gap-2">
          <Show when={category.tagCount > 0}>
            <span class="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
              {category.tagCount} tags assigned
            </span>
          </Show>
        </div>
      </div>

      <form onSubmit={handleUpdate} class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          {/* Slug */}
          <div>
            <TextField
              name="slug"
              value={editableCategory.slug}
              onChange={(value) => setEditableCategory('slug', value)}
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
              value={editableCategory.name}
              onChange={(value) => setEditableCategory('name', value)}
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
              value={editableCategory.description || ''}
              onChange={(value) => setEditableCategory('description', value || null)}
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
              value={editableCategory.color}
              onInput={(e) => setEditableCategory('color', e.currentTarget.value)}
              class="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Visibility and Actions */}
          <div class="flex items-center gap-3">
            <Checkbox
              checked={editableCategory.visible}
              onChange={(checked) => setEditableCategory('visible', checked)}
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
          </div>
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-gray-200">
          <div class="flex gap-3">
            <Show when={hasChanges()}>
              <button
                type="submit"
                disabled={updateCategory.isPending || !editableCategory.slug.trim() || !editableCategory.name.trim()}
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Show when={updateCategory.isPending} fallback="Update Category">
                  Updating...
                </Show>
              </button>
            </Show>

            <button
              type="button"
              onClick={() => {
                setEditableCategory({
                  slug: category.slug,
                  name: category.name,
                  description: category.description,
                  color: category.color,
                  icon: category.icon,
                  visible: category.visible,
                })
              }}
              class="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={!hasChanges()}
            >
              Reset
            </button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteCategory.isPending}
            class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Show when={deleteCategory.isPending} fallback={showDeleteConfirm() ? "Confirm Delete" : "Delete"}>
              Deleting...
            </Show>
          </button>
        </div>

        <Show when={updateCategory.error}>
          <div class="text-red-600 text-sm">
            Error: {updateCategory.error?.message || 'Failed to update category'}
          </div>
        </Show>

        <Show when={deleteCategory.error}>
          <div class="text-red-600 text-sm">
            Error: {deleteCategory.error?.message || 'Failed to delete category'}
          </div>
        </Show>

        <Show when={showDeleteConfirm()}>
          <div class="bg-red-50 border border-red-200 rounded-md p-3">
            <p class="text-red-800 text-sm">
              Are you sure you want to delete this category? This will set all associated tags' categoryId to null.
              <Show when={category.tagCount > 0}>
                <br />This will affect {category.tagCount} tag(s).
              </Show>
            </p>
            <div class="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                class="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </Show>
      </form>

      {/* Collapsible Tag Section */}
      <Show when={expanded()}>
        <div class="mt-4 pt-4 border-t border-gray-200">
          <TagSection categoryId={category.id} />
        </div>
      </Show>
    </div>
  );
}
