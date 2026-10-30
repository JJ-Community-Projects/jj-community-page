import {type Component, createSignal, Show} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {createStore} from "solid-js/store";
import {FaSolidChevronRight} from "solid-icons/fa";
import type {Tag, TagAlias} from "../../../../../lib/db/schema/tags-schema.ts";
import {Button, IconButton} from "../../../../ui/Button";
import {ConfirmDialog} from "../../../../ui/Dialog";
import {Chip} from "../../../../ui/Labels";
import {Alert} from "../../../../ui/Status";
import {cn} from "../../../../ui/cn";
import {nestedSurface, TagFormFields} from "../common/TagFormFields.tsx";
import {TagAliasSection} from "../alias/TagAliasSection.tsx";

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
    deleteTag.mutate({
      id: tag.id
    })
    setShowDeleteConfirm(false)
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
    <div class={cn(nestedSurface, 'flex flex-col gap-3')}>
      <div class="flex flex-wrap items-center gap-2">
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={expanded() ? `Hide aliases of ${tag.name}` : `Show aliases of ${tag.name}`}
          aria-expanded={expanded()}
          onClick={() => setExpanded(!expanded())}
        >
          <FaSolidChevronRight class={cn('size-3 transition-transform', expanded() && 'rotate-90')} aria-hidden="true" />
        </IconButton>
        <h4 class="min-w-0 flex-1 text-sm font-semibold">
          {tag.name}{' '}
          <span class="text-fg-muted font-normal">({tag.userCount + tag.streamCount} uses)</span>
        </h4>
        <Show when={tag.totalUsage > 0}>
          <Chip size="sm">{tag.totalUsage} total uses</Chip>
        </Show>
        <Show when={tag.aliases.length > 0}>
          <Chip size="sm" tone="accent">{tag.aliases.length} aliases</Chip>
        </Show>
      </div>

      <form onSubmit={handleUpdate} class="flex flex-col gap-3">
        <TagFormFields
          draft={editableTag}
          onChange={(patch) => setEditableTag(patch)}
          namePlaceholder="e.g., Minecraft"
          slugPlaceholder="e.g., minecraft"
        />

        <div class="border-line flex flex-wrap items-center gap-2 border-t pt-3">
          <Show when={hasChanges()}>
            <Button
              type="submit"
              size="sm"
              variant="accent"
              disabled={updateTag.isPending || !editableTag.name.trim() || !editableTag.slug.trim()}
            >
              <Show when={updateTag.isPending} fallback="Update">
                Updating...
              </Show>
            </Button>
          </Show>

          <Button
            size="sm"
            onClick={() => {
              setEditableTag({
                name: tag.name,
                slug: tag.slug,
                description: tag.description,
                color: tag.color,
                visible: tag.visible,
              })
            }}
            disabled={!hasChanges()}
          >
            Reset
          </Button>

          <Button
            size="sm"
            variant="danger"
            class="ml-auto"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteTag.isPending}
          >
            <Show when={deleteTag.isPending} fallback="Delete">
              Deleting...
            </Show>
          </Button>
        </div>

        <Show when={updateTag.error}>
          <Alert tone="danger">
            Error: {updateTag.error?.message || 'Failed to update tag'}
          </Alert>
        </Show>

        <Show when={deleteTag.error}>
          <Alert tone="danger">
            Error: {deleteTag.error?.message || 'Failed to delete tag'}
          </Alert>
        </Show>
      </form>

      {/* Collapsible Tag Alias Section */}
      <Show when={expanded()}>
        <div class="border-line border-t pt-3">
          <TagAliasSection tagId={tag.id}/>
        </div>
      </Show>

      <ConfirmDialog
        open={showDeleteConfirm()}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Tag"
        text={
          <>
            Are you sure you want to delete this tag? This will remove it from all users and streams.
            <Show when={tag.totalUsage > 0}>
              {' '}This will affect {tag.totalUsage} usage(s).
            </Show>
          </>
        }
        confirmLabel="Delete"
        pending={deleteTag.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
