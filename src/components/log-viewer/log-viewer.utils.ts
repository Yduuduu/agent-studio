/** Distance from the bottom (px) still treated as "following" the stream. */
export const FOLLOW_THRESHOLD_PX = 32;

export function isNearBottom(
  {
    scrollTop,
    scrollHeight,
    clientHeight,
  }: Pick<HTMLElement, "scrollTop" | "scrollHeight" | "clientHeight">,
  threshold = FOLLOW_THRESHOLD_PX,
) {
  return scrollHeight - scrollTop - clientHeight <= threshold;
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3,
  hourCycle: "h23",
});

export const formatLogTime = (timestamp: number) => timeFormat.format(timestamp);
