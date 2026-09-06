export const CONTEST_TIME_ZONE = "Asia/Kolkata";

export const toDateTimeLocalInputValue = (date?: Date | null) => {
  if (!date) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export const dateTimeLocalToIso = (value?: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const formatContestDateTime = (date: Date) =>
  date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CONTEST_TIME_ZONE,
  });
