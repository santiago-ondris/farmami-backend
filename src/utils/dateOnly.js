function buildUtcDate(dateString, hours, minutes, seconds, milliseconds) {
  const [year, month, day] = String(dateString).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds));
}

export function parseDateInput(value) {
  if (value instanceof Date) {
    return value;
  }

  const normalized = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return buildUtcDate(normalized, 12, 0, 0, 0);
  }

  return new Date(normalized);
}

export function getDateRangeStart(value) {
  const normalized = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return buildUtcDate(normalized, 0, 0, 0, 0);
  }

  return new Date(normalized);
}

export function getDateRangeEnd(value) {
  const normalized = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return buildUtcDate(normalized, 23, 59, 59, 999);
  }

  return new Date(normalized);
}
