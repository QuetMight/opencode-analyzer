function formatDate(date: Date, separator: string): string {
  const pad = (num: number) => num.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  const datePart = `${year}-${month}-${day}`;
  const timePart =
    separator === "_"
      ? `${hours}-${minutes}-${seconds}-${milliseconds}`
      : `${hours}:${minutes}:${seconds}.${milliseconds}`;

  return `${datePart}${separator}${timePart}`;
}

export function getFileTimestamp(): string {
  return formatDate(new Date(), "_");
}

export function getTimestamp(): string {
  return formatDate(new Date(), " ");
}
