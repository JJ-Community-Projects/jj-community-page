import {initializeApp} from "firebase/app";
import {doc, getDoc, getFirestore, onSnapshot} from "firebase/firestore";
import {createSignal, onCleanup} from "solid-js";
import type {FullSchedule} from "./model/ContentTypes.ts";
import {type YogsScheduleFirestore, yogsScheduleFirestoreToFullSchedule} from "./model/YogsScheduleFirestore.ts";
import {createStore} from "solid-js/store";

type Config = {
  showSchedule: boolean
}

export async function getConfig() {

  const firebaseConfig = JSON.parse(import.meta.env.PUBLIC_FIREBASE_CONFIG)

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const ref = doc(db, "Config", "Website")
  const data = await  getDoc(ref)
  return data.data() as Config
}

export function useConfig() {
  const firebaseConfig = JSON.parse(import.meta.env.PUBLIC_FIREBASE_CONFIG)

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);


  const [config, setConfig] = createStore<{
    data?: Config

    error: any,
    loading: boolean
  }>({
    data: undefined,
    error: null,
    loading: true
  })

  const ref = doc(db, "Config", "Website")

  const unsubscribe = onSnapshot(ref, (doc) => {
    const data = doc.data() as {
      showSchedule: boolean
    } | undefined
    if (!data) {
      return
    }
    setConfig('data',data);
    setConfig('loading', false)
  },(error) => {
    console.error(error)
    setConfig('error', error)
    setConfig('loading', false)
  })

  onCleanup(() => {
    unsubscribe();
  })

  return config
}
