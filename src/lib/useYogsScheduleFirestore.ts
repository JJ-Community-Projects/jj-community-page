import {initializeApp} from "firebase/app";
import {doc, type DocumentReference, getFirestore} from "firebase/firestore";
import type {FullCreator, FullSchedule} from "./model/ContentTypes.ts";
import {type YogsScheduleFirestore, yogsScheduleFirestoreToFullSchedule} from "./model/YogsScheduleFirestore.ts";
import {useFirestoreDocWithTransFormer} from "./useFirestoreDoc.ts";


export const useYogsScheduleFirestore = (creators: FullCreator[]) => {

  const creatorsMap: { [key: string]: FullCreator } = {}

  for (const creator of creators) {
    creatorsMap[creator.id] = creator
  }

  const firebaseConfig = JSON.parse(import.meta.env.PUBLIC_FIREBASE_CONFIG)

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const scheduleRef = doc(db, "Schedules", "2024") as DocumentReference<YogsScheduleFirestore>

  return useFirestoreDocWithTransFormer<YogsScheduleFirestore, FullSchedule>(scheduleRef, (data) => {
    return yogsScheduleFirestoreToFullSchedule(data, creators)
  })
}
