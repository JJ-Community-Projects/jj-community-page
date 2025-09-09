import {type Component} from "solid-js";
import {AddStreamMetaSection} from "./sections/AddStreamMetaSection.tsx";
import {AddStreamTimeSection} from "./sections/AddStreamTimeSection.tsx";
import {AddStreamLinksSection} from "./sections/AddStreamLinksSection.tsx";
import {AddStreamDescriptionSection} from "./sections/AddStreamDescriptionSection.tsx";
import {AddStreamTagsSection} from "./sections/AddStreamTagsSection.tsx";

export const AddStreamFormBody: Component = () => {
  return (
    <div class="flex flex-col gap-6">
      <AddStreamMetaSection/>
      <AddStreamTimeSection/>
      <AddStreamLinksSection/>
      <AddStreamDescriptionSection/>
      <AddStreamTagsSection/>
    </div>
  );
};

export default AddStreamFormBody;
