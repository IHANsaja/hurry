type Numeric = { toString(): string };

export function formatPrice(value: Numeric) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value.toString()));
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function timeAgo(value: Date) {
  const seconds = Math.floor((Date.now() - value.getTime()) / 1000);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
  ];

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  let previous = 1;
  for (const [limit, unit] of units) {
    if (seconds < limit) return formatter.format(-Math.floor(seconds / previous), unit);
    previous = limit;
  }

  return formatter.format(-Math.floor(seconds / 31557600), "year");
}
