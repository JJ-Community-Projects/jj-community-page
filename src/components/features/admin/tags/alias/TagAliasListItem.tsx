import {type Component, createSignal, Show} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import type {TagAlias} from "../../../../../lib/db/schema/tags-schema.ts";
import {Button} from "../../../../ui/Button";
import {ConfirmDialog} from "../../../../ui/Dialog";
import {Alert} from "../../../../ui/Status";
import {TileGroup} from "../../../../ui/Tile";

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
    deleteAlias.mutate({
      aliasId: alias.id
    })
    setShowDeleteConfirm(false)
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
    <TileGroup pad="sm" class="flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3">
          <h5 class="text-sm font-semibold">
            "{alias.alias}"
          </h5>
          <span class="text-fg-muted text-xs">
            Created {formatDate(alias.createdAt)}
          </span>
        </div>

        <Button
          size="sm"
          variant="danger"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteAlias.isPending}
        >
          <Show when={deleteAlias.isPending} fallback="Delete">
            Deleting...
          </Show>
        </Button>
      </div>

      <Show when={deleteAlias.error}>
        <Alert tone="danger">
          Error: {deleteAlias.error?.message || 'Failed to delete alias'}
        </Alert>
      </Show>

      <ConfirmDialog
        open={showDeleteConfirm()}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Alias"
        text={<>Are you sure you want to delete the alias "{alias.alias}"? This action cannot be undone.</>}
        confirmLabel="Delete"
        pending={deleteAlias.isPending}
        onConfirm={handleDelete}
      />
    </TileGroup>
  );
}
