import {type Component, Show} from "solid-js";
import type {Stream} from "../../../../lib/orpc/public/schemas/schedules.ts";
import {DateTime} from "luxon";
import {useNow} from "../../../../lib/utils/useNow.ts";
import {type ModalSignal} from "../../../../lib/createModalSignal.ts";
import {getStreamColor} from "../../../../functions/jjDatesToColors.ts";
import {Dialog} from "@kobalte/core";
import {AiOutlineClose} from "solid-icons/ai";
import {getTextColor} from "../../../../lib/utils/textColors.ts";
import {StreamTags} from "./StreamTags";
import {StreamParticipants} from "./StreamParticipants";

interface ScheduleStreamDetailDialogProps {
  stream: Stream;
  modalSignal: ModalSignal;
}

/**
 * Dialog component that displays detailed information about a stream
 * Shows title, subtitle, description, time, countdown, and tags
 */
export const ScheduleStreamDetailDialog: Component<ScheduleStreamDetailDialogProps> = (props) => {
  const stream = () => props.stream;
  const now = useNow();

  // Convert UTC dates from backend to DateTime objects
  const getStreamStartDateTime = () => {
    // Create DateTime from JS Date, assuming it's in UTC, then convert to local time
    return DateTime.fromJSDate(stream().start, { zone: 'utc' }).toLocal();
  };

  const getStreamEndDateTime = () => {
    // Create DateTime from JS Date, assuming it's in UTC, then convert to local time
    return DateTime.fromJSDate(stream().end, { zone: 'utc' }).toLocal();
  };

  // Calculate the highlight color using getStreamColor
  const getHighlightColor = () => {
    // For color calculation, we still use UTC to maintain consistent colors
    const startDate = DateTime.fromJSDate(stream().start, { zone: 'utc' });
    return getStreamColor(startDate);
  };

  const highlightColor = getHighlightColor();
  const textColor = getTextColor(highlightColor);

  const showCountdown = () => {
    return getStreamStartDateTime() > now();
  };

  const isLive = () => {
    const start = getStreamStartDateTime();
    const end = getStreamEndDateTime();
    return start < now() && end > now();
  };

  const diff = () => {
    return getStreamStartDateTime().diff(now());
  };

  const countdownFormat = () => {
    const d = diff();
    if (d.as('day') < 1) {
      return d.toFormat("hh'h' mm'm' ss's'");
    }
    return d.toFormat("dd'd' hh'h' mm'm' ss's'");
  };

  return (
    <Dialog.Root open={props.modalSignal.isOpen()} onOpenChange={props.modalSignal.setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/20 lg:p-16 p-2 z-20"/>
        <Dialog.Content
          class="z-30 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-[calc(100vw_-_24px)] lg:w-[min(calc(100vw_-_16px),_386px)] md:h-[90vh] h-[70vh] flex flex-col">
          <Dialog.Title
            class="p-2 flex flex-row gap-4 rounded-t-2xl"
            style={{
              background: highlightColor,
              color: textColor
            }}
          >
            <button class="rounded-full hover:bg-accent-200/10 aspect-square"
                    onClick={() => props.modalSignal.close()}>
              <AiOutlineClose size={24}/>
            </button>
            <div class="flex flex-col">
              <p class="text-xl font-bold">{stream().title}</p>
              <Show when={stream().subtitle}>
                <p>{stream().subtitle}</p>
              </Show>
            </div>
          </Dialog.Title>
          <div class="h-full flex flex-1 flex-col overflow-hidden overscroll-none">
            <div
              class="h-full flex flex-col overflow-auto overflow-x-hidden scrollbar-thin scrollbar-corner-primary-100 scrollbar-thumb-accent-500 scrollbar-track-accent-100">
              <div class="px-2 pt-2 pb-4 h-full flex flex-col justify-between">
                <div class="flex flex-col">
                  <Show when={stream().description}>
                    <Dialog.Description class="mb-6">{stream().description}</Dialog.Description>
                  </Show>

                  <Show when={isLive()}>
                    <div class="flex flex-row py-1">
                      <div
                        class="transition-all bg-accent-200/50 hover:bg-accent-200 flex flex-row items-center gap-1 rounded-full px-2 py-0.5 text-black">
                        Watch Live <div class="h-2 w-2">
                          <span class="relative flex h-2 w-2">
                            <span
                              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 duration-700"
                            />
                            <span class="relative inline-flex h-full w-full rounded-full bg-red-500"/>
                          </span>
                      </div>
                      </div>
                    </div>
                  </Show>

                  <p>{getStreamStartDateTime().toLocaleString({
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    timeZoneName: 'short'
                  })}</p>

                  <Show when={showCountdown()}>
                    <p>{countdownFormat()}</p>
                  </Show>

                  <StreamTags tags={stream().tags} />
                  <StreamParticipants participants={stream().participants} />
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
