import {type Component, For} from "solid-js";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {AddTagCategoryPanel} from "./AddTagCategoryPanel.tsx";
import {QueryComponent} from "../../../../common/QueryComponent.tsx";
import {TagCategoryListItem} from "./TagCategoryListItem.tsx";

interface TagsCategoriesSectionProps {
}

export const TagsCategoriesSection: Component<TagsCategoriesSectionProps> = (props) => {

  return (
    <div class='flex flex-col'>
      <AddTagCategoryPanel/>
      <QueryComponent queryOptions={() => orpcPrivate.adminTags.getAllTagCategories.queryOptions({
        input: {}
      })}>
        {
          (categories) => {
            return (
              <For each={categories}>
                {
                  (category) => {
                    return <TagCategoryListItem category={category}/>
                  }
                }
              </For>
            )
          }
        }
      </QueryComponent>
    </div>
  );
}
