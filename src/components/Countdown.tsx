import {useNextJJStartDate} from "#lib/utils/jjDates.ts"
import {useJJStartCountdown} from "../lib/utils/jjDates.ts";
import type {Component} from "solid-js";

export const Countdown: Component = () => {
  const nextJJStartDate = useNextJJStartDate()
  const jjStartCountdown = useJJStartCountdown()
  return (
    <div class={'mx-auto flex w-fit flex-col items-center p-1 text-center text-base text-white md:w-[50%] md:text-2xl'}>
      <p class={'text-xl md:text-3xl'}>{nextJJStartDate().toLocal().toFormat('DDDD')}</p>
      <p class={'text-xl md:text-3xl'}>{nextJJStartDate().toLocal().toFormat('ttt')}</p>
      <p class={''}>{nextJJStartDate().toFormat('DDDD')}</p>
      <p class={''}>{nextJJStartDate().toFormat('ttt')}</p>
      <div class={'flex flex-col items-center p-1 text-white md:p-4'}>
        <p class={'text-2xl md:text-4xl'}>Jingle Jam {nextJJStartDate().year} starts in</p>
        <p class={'font-mono text-2xl md:text-4xl'}>{jjStartCountdown().toFormat("dd'd' hh'h' mm'm' ss's'")}</p>
      </div>
    </div>
  )
}
