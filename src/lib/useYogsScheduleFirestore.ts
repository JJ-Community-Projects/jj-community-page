import {initializeApp} from "firebase/app";
import {doc, getFirestore, onSnapshot} from "firebase/firestore";
import {createSignal, onCleanup} from "solid-js";
import type {FullCreator, FullSchedule} from "./model/ContentTypes.ts";
import {type YogsScheduleFirestore, yogsScheduleFirestoreToFullSchedule} from "./model/YogsScheduleFirestore.ts";


export const useYogsScheduleFirestore = (creators: FullCreator[]) => {

  const creatorsMap: { [key: string]: FullCreator } = {}

  for (const creator of creators) {
    creatorsMap[creator.id] = creator
  }

  const firebaseConfig = JSON.parse(import.meta.env.PUBLIC_FIREBASE_CONFIG)

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const [schedule, setSchedule] = createSignal<FullSchedule | undefined>(undefined)

  const scheduleRef = doc(db, "Schedules", "2024")

  const unsubscribe = onSnapshot(scheduleRef, (doc) => {
    const data = doc.data() as YogsScheduleFirestore | undefined
    if (!data) {
      return
    }
    setSchedule(yogsScheduleFirestoreToFullSchedule(data, creators));
  })

  onCleanup(() => {
    unsubscribe();
  })

  return schedule
}
