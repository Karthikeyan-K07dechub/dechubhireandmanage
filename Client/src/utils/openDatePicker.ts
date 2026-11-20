import type { MouseEvent } from 'react';

export function openDatePicker(event: MouseEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  if (typeof input.showPicker !== 'function') return;

  try {
    input.showPicker();
    event.preventDefault();
  } catch {
    // Let the browser handle the click if it blocks programmatic opening.
  }
}
