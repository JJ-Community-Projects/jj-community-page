import {type Component, createSignal, Show} from "solid-js";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {createStore} from "solid-js/store";
import {FaSolidChevronRight} from "solid-icons/fa";
import {Button, IconButton} from "../../../../ui/Button";
import {ConfirmDialog} from "../../../../ui/Dialog";
import {Alert} from "../../../../ui/Status";
import {TileGroup} from "../../../../ui/Tile";
import {cn} from "../../../../ui/cn";
import {TagFormFields} from "../common/TagFormFields.tsx";
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
    deleteCategory.mutate({
      id: category.id
    })
    setShowDeleteConfirm(false)
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
    <TileGroup pad="md" class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={expanded() ? `Hide tags of ${category.name}` : `Show tags of ${category.name}`}
          aria-expanded={expanded()}
          onClick={() => setExpanded(!expanded())}
        >
          <FaSolidChevronRight class={cn('size-3.5 transition-transform', expanded() && 'rotate-90')} aria-hidden="true" />
        </IconButton>
        <span
          class="size-3 shrink-0 rounded-full bg-(--category-color) ring-1 ring-black/10"
          style={{'--category-color': category.color}}
        />
        <h3 class="min-w-0 flex-1 font-semibold">
          {category.name}{' '}
          <span class="text-fg-muted text-sm font-normal">
            ({category.tagCount} tags, {category.userUsage + category.streamUsage} uses)
          </span>
        </h3>
      </div>

      <form onSubmit={handleUpdate} class="flex flex-col gap-3">
        <TagFormFields
          draft={editableCategory}
          onChange={(patch) => setEditableCategory(patch)}
          namePlaceholder="e.g., Gaming"
          slugPlaceholder="e.g., gaming"
        />

        <div class="border-line flex flex-wrap items-center gap-2 border-t pt-3">
          <Show when={hasChanges()}>
            <Button
              type="submit"
              size="sm"
              variant="accent"
              disabled={updateCategory.isPending || !editableCategory.slug.trim() || !editableCategory.name.trim()}
            >
              <Show when={updateCategory.isPending} fallback="Update Category">
                Updating...
              </Show>
            </Button>
          </Show>

          <Button
            size="sm"
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
            disabled={!hasChanges()}
          >
            Reset
          </Button>

          <Button
            size="sm"
            variant="danger"
            class="ml-auto"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteCategory.isPending}
          >
            <Show when={deleteCategory.isPending} fallback="Delete">
              Deleting...
            </Show>
          </Button>
        </div>

        <Show when={updateCategory.error}>
          <Alert tone="danger">
            Error: {updateCategory.error?.message || 'Failed to update category'}
          </Alert>
        </Show>

        <Show when={deleteCategory.error}>
          <Alert tone="danger">
            Error: {deleteCategory.error?.message || 'Failed to delete category'}
          </Alert>
        </Show>
      </form>

      {/* Collapsible Tag Section */}
      <Show when={expanded()}>
        <div class="border-line border-t pt-3">
          <TagSection categoryId={category.id} />
        </div>
      </Show>

      <ConfirmDialog
        open={showDeleteConfirm()}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Category"
        text={
          <>
            Are you sure you want to delete this category? This will set all associated tags' categoryId to null.
            <Show when={category.tagCount > 0}>
              {' '}This will affect {category.tagCount} tag(s).
            </Show>
          </>
        }
        confirmLabel="Delete"
        pending={deleteCategory.isPending}
        onConfirm={handleDelete}
      />
    </TileGroup>
  );
}
