import {type Component, Show, createSignal} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../lib/orpc/client.ts";
import type {TagAlias} from "../../../../lib/db/schema/tags-schema.ts";

interface TagAliasListItemProps {
  alias: TagAlias
}

export const TagAliasListItem: Component<TagAliasListItemProps> = (props) => {
  const alias = props.alias;
  const client = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  const deleteAlias = useMutation(() =>
    orpcPrivate.adminTags.removeTagAlias.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: orpcPrivate.adminTags.getTagAliases.key()
        })
      }
    })
  )

  const handleDelete = () => {
    if (showDeleteConfirm()) {
      deleteAlias.mutate({
        aliasId: alias.id
      })
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div class="flex justify-between items-center">
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <h5 class="text-md font-medium text-gray-900">
              "{alias.alias}"
            </h5>
            <span class="text-xs text-gray-500">
              Created {formatDate(alias.createdAt)}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteAlias.isPending}
            class="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Show when={deleteAlias.isPending} fallback={showDeleteConfirm() ? "Confirm Delete" : "Delete"}>
              Deleting...
            </Show>
          </button>
        </div>
      </div>

      <Show when={deleteAlias.error}>
        <div class="text-red-600 text-xs mt-2">
          Error: {deleteAlias.error?.message || 'Failed to delete alias'}
        </div>
      </Show>

      <Show when={showDeleteConfirm()}>
        <div class="bg-red-50 border border-red-200 rounded-md p-2 mt-3">
          <p class="text-red-800 text-xs">
            Are you sure you want to delete the alias "{alias.alias}"? This action cannot be undone.
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
    </div>
  );
}
