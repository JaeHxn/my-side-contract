export const KOREA_TIME_ZONE = "Asia/Seoul";

type DateTimeStyle = "full" | "long" | "medium" | "short";

export interface KoreanDateTimeOptions {
  dateStyle?: DateTimeStyle;
  timeStyle?: DateTimeStyle;
  includeTimeZoneLabel?: boolean;
}

export function formatKoreanDateTime(value: string | number | Date, options: KoreanDateTimeOptions = {}): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const formatted = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: options.dateStyle ?? "medium",
    timeStyle: options.timeStyle ?? "short",
    hourCycle: "h23",
    timeZone: KOREA_TIME_ZONE
  }).format(date);

  return options.includeTimeZoneLabel === false ? formatted : `${formatted} (한국 시간)`;
}
