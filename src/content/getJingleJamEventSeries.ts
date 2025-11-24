import type { YogsSchedule } from '../lib/orpc/private/yogs/contract.ts'

export function getJingleJamEventSeries(data: YogsSchedule) {
  const id = `https://jj.ostof.dev/yogs/${data.start.getFullYear()}`
  const series = {
    "@context": "https://schema.org",
    "@type": "EventSeries",
    "@id": id,
    "name": data.title,
    "startDate": data.start.toISOString(),
    "endDate": data.end.toISOString(),
    "location": {
      "@type": "VirtualLocation",
      "url": "https://twitch.tv/yogscast"
    },
  };

  const events: any[] = [];


  data.days.forEach((day, dayIndex) => {
    day.streams.forEach((stream, streamIndex) => {
      const eventId = `${id}/day${dayIndex}/stream${streamIndex}`;
      const event = {
        "@context": "https://schema.org",
        "@type": "Event",
        "@id": eventId,
        "name": stream.title,
        "description": stream.description || stream.subtitle || "",
        "startDate": stream.start.toISOString(),
        "endDate": stream.end.toISOString(),
        "superEvent": series,
        "performer": stream?.creators?.map(c => ({
          "@type": "Person",
          "name": c.name,
          "url": c.url || undefined
        })),
        "location": {
          "@type": "Place",
          "url": "https://twitch.tv/yogscast"
        },
      };
      events.push(event);
    });
  });

  // Prepare full JSON-LD array (series + individual events)
  const jsonLd = [{... series, subEvent: events }, ...events]

  return jsonLd;
}
