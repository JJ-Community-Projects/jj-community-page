import {type Component, For} from "solid-js";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {AddTagCategoryPanel} from "./AddTagCategoryPanel.tsx";
import {QueryComponent} from "../../../../common/QueryComponent.tsx";
import {Spinner} from "../../../../ui/Status";
import {TagCategoryListItem} from "./TagCategoryListItem.tsx";

export const TagsCategoriesSection: Component = () => {

  return (
    <>
      <AddTagCategoryPanel/>
      <QueryComponent
        queryOptions={() => orpcPrivate.adminTags.getAllTagCategories.queryOptions({
          input: {}
        })}
        loading={() => <Spinner label="Loading…" />}
      >
        {
          (categories) => (
            <div class="flex flex-col gap-3">
              <For each={categories}>
                {(category) => <TagCategoryListItem category={category}/>}
              </For>
            </div>
          )
        }
      </QueryComponent>
    </>
  );
}
