function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatDateDisplay(value) {
  if (!value) return '';

  if (value instanceof Date) {
    return `${pad(value.getUTCDate())}/${pad(value.getUTCMonth() + 1)}/${value.getUTCFullYear()}`;
  }

  const stringValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    const [year, month, day] = stringValue.split('-');
    return `${day}/${month}/${year}`;
  }

  if (stringValue.includes('T')) {
    const [datePart] = stringValue.split('T');
    const [year, month, day] = datePart.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
  }

  const parsed = new Date(stringValue);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return `${pad(parsed.getUTCDate())}/${pad(parsed.getUTCMonth() + 1)}/${parsed.getUTCFullYear()}`;
}
