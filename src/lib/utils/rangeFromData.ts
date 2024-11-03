export function rangeFromData(streams: { start: Date, end: Date }[]): {
  start: Date,
  end: Date
} {
  const earliestStreamStart = streams.reduce((earliest, stream) => {
    if (earliest === null) {
      return stream
    }
    return stream.start < earliest.start ? stream : earliest
  }).start
  const latestStreamEnd = streams.reduce((latest, stream) => {
    if (latest === null) {
      return stream
    }
    return stream.end > latest.end ? stream : latest
  }).end
  return {
    start: earliestStreamStart,
    end: latestStreamEnd
  }
}
