import {type Component, createSignal, Show} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../lib/orpc/client.ts";
import {createStore} from "solid-js/store";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";
import type {Tag, TagAlias} from "../../../../lib/db/schema/tags-schema.ts";
import {TagAliasSection} from "./TagAliasSection.tsx";

interface TagListItemProps {
  tag: Tag & {
    userCount: number;
    streamCount: number;
    totalUsage: number;
    aliases: TagAlias[];
  }
}

export const TagListItem: Component<TagListItemProps> = (props) => {
  const tag = props.tag;
  const client = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [expanded, setExpanded] = createSignal(false);

  const updateTag = useMutation(() =>
    orpcPrivate.adminTags.updateTag.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: orpcPrivate.adminTags.getTagsWithUsageAndAliasesByCategory.key()
        })
      }
    })
  )

  const deleteTag = useMutation(() =>
    orpcPrivate.adminTags.deleteTag.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: orpcPrivate.adminTags.getTagsWithUsageAndAliasesByCategory.key()
        })
      }
    })
  )

  const [editableTag, setEditableTag] = createStore<{
    name: string
    slug: string
    description: string | null
    color: string
    visible: boolean
  }>({
    name: tag.name,
    slug: tag.slug,
    description: tag.description,
    color: tag.color,
    visible: tag.visible,
  })

  const handleUpdate = (e: Event) => {
    e.preventDefault()

    // Basic validation
    if (!editableTag.name.trim() || !editableTag.slug.trim()) {
      return
    }

    updateTag.mutate({
      id: tag.id,
      name: editableTag.name,
      slug: editableTag.slug,
      description: editableTag.description || undefined,
      color: editableTag.color,
      visible: editableTag.visible,
    })
  }

  const handleDelete = () => {
    if (showDeleteConfirm()) {
      deleteTag.mutate({
        id: tag.id
      })
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
    }
  }

  const hasChanges = () => {
    return (
      editableTag.name !== tag.name ||
      editableTag.slug !== tag.slug ||
      editableTag.description !== tag.description ||
      editableTag.color !== tag.color ||
      editableTag.visible !== tag.visible
    )
  }

  return (
    <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div class="flex justify-between items-center mb-3">
        <div class="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded())}
            class="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg
              class={`w-4 h-4 transition-transform ${expanded() ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"/>
            </svg>
          </button>
          <h5 class="text-md font-medium text-gray-900">
            {tag.name} ({tag.userCount + tag.streamCount} uses)
          </h5>
        </div>
        <div class="flex items-center gap-2">
          <Show when={tag.totalUsage > 0}>
            <span class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              {tag.totalUsage} total uses
            </span>
          </Show>
          <Show when={tag.aliases.length > 0}>
            <button
              type="button"
              onClick={() => setExpanded(!expanded())}
              class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {tag.aliases.length} aliases
            </button>
          </Show>
        </div>
      </div>

      <form onSubmit={handleUpdate} class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Name */}
          <div>
            <TextField
              name="name"
              value={editableTag.name}
              onChange={(value) => setEditableTag('name', value)}
              required
            >
              <TextField.Label class="block text-xs font-medium text-gray-700 mb-1">
                Name
              </TextField.Label>
              <TextField.Input
                placeholder="e.g., Minecraft"
                class="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </TextField>
          </div>

          {/* Slug */}
          <div>
            <TextField
              name="slug"
              value={editableTag.slug}
              onChange={(value) => setEditableTag('slug', value)}
              required
            >
              <TextField.Label class="block text-xs font-medium text-gray-700 mb-1">
                Slug
              </TextField.Label>
              <TextField.Input
                placeholder="e.g., minecraft"
                pattern="^[a-z0-9-]+$"
                class="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </TextField>
          </div>

          {/* Description */}
          <div>
            <TextField
              name="description"
              value={editableTag.description || ''}
              onChange={(value) => setEditableTag('description', value || null)}
            >
              <TextField.Label class="block text-xs font-medium text-gray-700 mb-1">
                Description
              </TextField.Label>
              <TextField.Input
                placeholder="Optional description"
                class="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </TextField>
          </div>

          {/* Color and Visibility */}
          <div class="flex items-end gap-2">
            <div class="flex-1">
              <label for="color" class="block text-xs font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                id="color"
                type="color"
                value={editableTag.color}
                onInput={(e) => setEditableTag('color', e.currentTarget.value)}
                class="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <Checkbox
              checked={editableTag.visible}
              onChange={(checked) => setEditableTag('visible', checked)}
              class="flex items-center pb-1"
            >
              <Checkbox.Input class="sr-only"/>
              <Checkbox.Control
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 border border-gray-300 rounded bg-white flex items-center justify-center">
                <Checkbox.Indicator>
                  <svg class="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"/>
                  </svg>
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label class="ml-1 text-xs text-gray-700">Visible</Checkbox.Label>
            </Checkbox>
          </div>
        </div>

        <div class="flex justify-between items-center pt-3 border-t border-gray-200">
          <div class="flex gap-2">
            <Show when={hasChanges()}>
              <button
                type="submit"
                disabled={updateTag.isPending || !editableTag.name.trim() || !editableTag.slug.trim()}
                class="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Show when={updateTag.isPending} fallback="Update">
                  Updating...
                </Show>
              </button>
            </Show>

            <button
              type="button"
              onClick={() => {
                setEditableTag({
                  name: tag.name,
                  slug: tag.slug,
                  description: tag.description,
                  color: tag.color,
                  visible: tag.visible,
                })
              }}
              class="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={!hasChanges()}
            >
              Reset
            </button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteTag.isPending}
            class="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Show when={deleteTag.isPending} fallback={showDeleteConfirm() ? "Confirm Delete" : "Delete"}>
              Deleting...
            </Show>
          </button>
        </div>

        <Show when={updateTag.error}>
          <div class="text-red-600 text-xs">
            Error: {updateTag.error?.message || 'Failed to update tag'}
          </div>
        </Show>

        <Show when={deleteTag.error}>
          <div class="text-red-600 text-xs">
            Error: {deleteTag.error?.message || 'Failed to delete tag'}
          </div>
        </Show>

        <Show when={showDeleteConfirm()}>
          <div class="bg-red-50 border border-red-200 rounded-md p-2">
            <p class="text-red-800 text-xs">
              Are you sure you want to delete this tag? This will remove it from all users and streams.
              <Show when={tag.totalUsage > 0}>
                <br/>This will affect {tag.totalUsage} usage(s).
              </Show>
            </p>
            <div class="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                class="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </Show>
      </form>

      {/* Collapsible Tag Alias Section */}
      <Show when={expanded()}>
        <div class="mt-4 pt-4 border-t border-gray-200">
          <TagAliasSection tagId={tag.id}/>
        </div>
      </Show>
    </div>
  );
}
