import {tagsRouter} from './tags/impl.ts'
import {socialRouter} from "./social/socialRouter.ts";
import {relationsRouter} from "./relations/relationsRouter.ts";
import {profileRouter} from "./profile/impl.ts";

export const editProfileRouter = {
  tags: tagsRouter,
  social: socialRouter,
  relations: relationsRouter,
  profile: profileRouter,
}
