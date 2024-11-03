import {type CollectionEntry, getCollection, getEntry} from "astro:content";
import type {ContentCreator, FullCreator} from "../lib/model/ContentTypes.ts";


export async function loadAllCreatorsFromContent(): Promise<FullCreator[]> {
  const creators = await getCollection("creators");
  return Promise.all(creators.map(async (creator) => {
    const data: ContentCreator = creator.data;
    const twitchUser = creator.data.twitchUser ? (await getEntry(creator.data.twitchUser)).data : undefined
    return {
      id: creator.id,
      ...data,
      twitchUser: twitchUser
    }
  }))
}

export async function loadCreatorFromContent(i: string | CollectionEntry<'creators'>) {
  if (typeof i === "string") {
    return loadCreatorFromId(i);
  }
  return loadCreatorFromEntry(i);
}

async function loadCreatorFromEntry(entry: CollectionEntry<'creators'>): Promise<FullCreator> {
  const twitchUser = entry.data.twitchUser ? (await getEntry(entry.data.twitchUser)).data : undefined
  return {
    id: entry.id,
    ...(entry.data),
    twitchUser: twitchUser,
  }
}

async function loadCreatorFromId(id: string) {
  const creator = await getEntry("creators", id);
  if (!creator) {
    return undefined
  }
  return loadCreatorFromEntry(creator);
}

export async function loadCreatorsFromContent(i?: (string | CollectionEntry<'creators'>)[]): Promise<FullCreator[]> {
  if (!i) {
    return []
  }
  if (i.length === 0) {
    return []
  }
  if (typeof i[0] === "string") {
    return loadCreatorsFromIds(i as string[]);
  }
  return loadCreatorsFromEntries(i as CollectionEntry<'creators'>[]);
}

async function loadCreatorsFromEntries(entries: CollectionEntry<'creators'>[]) {
  return Promise.all(entries.map(loadCreatorFromEntry))
}

async function loadCreatorsFromIds(ids: string[]) {
  return Promise.all(ids.map(loadCreatorFromId).filter((c): c is Promise<FullCreator> => c !== undefined))
}
