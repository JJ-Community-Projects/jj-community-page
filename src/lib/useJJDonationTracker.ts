import {initializeApp} from "firebase/app";
import {collection, type CollectionReference, doc, getFirestore, onSnapshot} from "firebase/firestore";
import type {JJData} from "./model/jjData/JJData.ts";
import {onCleanup, onMount} from "solid-js";
import {createStore} from "solid-js/store";
import type {JJCommunityFundraiser} from "./model/jjData/JJCommunityFundraiser.ts";

export function useJJDonationTracker() {

  const firebaseConfig = JSON.parse(import.meta.env.PUBLIC_FIREBASE_CONFIG)

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const coll = collection(db, 'JJDonationTracker') as CollectionReference<JJData>
  const d = doc(coll, '2024')
  const [data, setData] = createStore<({
    data: JJData | null
    error: any,
    loading: boolean
  })>({
    data: null,
    error: null,
    loading: true
  })

  const unsubscribe = onSnapshot(d, (doc) => {
    if (doc.exists()) {
      setData('data', doc.data())
      setData('loading', false)
    }
  }, (error) => {
    console.error(error)
    setData('error', error)
    setData('loading', false)
  })

  onCleanup(() => {
    unsubscribe()
  })

  return data
}

export function useFundraiser() {
  console.log('useFundraiser')
  const firebaseConfig = JSON.parse(import.meta.env.PUBLIC_FIREBASE_CONFIG)

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const coll = collection(db, 'Fundraiser') as CollectionReference<JJCommunityFundraiser>
  const d = doc(coll, '2023')
  const [data, setData] = createStore<({ data: JJCommunityFundraiser | null })>({data: null})
  let unsubscribe: any;
  onMount(() => {
    unsubscribe = onSnapshot(d, (doc) => {
      console.log('useFundraiser', doc.exists(), doc.data())
      if (doc.exists()) {
        setData('data', doc.data())
      }
    }, (error) => {
      console.error(error)
    })
  })


  onCleanup(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return data
}
