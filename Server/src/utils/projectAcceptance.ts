import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date.').refine(value => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Select a valid date.');

export const projectAcceptanceSchema = z.object({
  startDate: dateOnly,
  endDate: dateOnly,
}).refine(value => value.endDate >= value.startDate, {
  path: ['endDate'], message: 'End date must be on or after the start date.',
});

export const expectedProjectDatesSchema = z.object({
  expectedStartDate: dateOnly.optional(),
  expectedEndDate: dateOnly.optional(),
}).refine(value => (!value.expectedStartDate && !value.expectedEndDate) ||
  Boolean(value.expectedStartDate && value.expectedEndDate && value.expectedEndDate >= value.expectedStartDate), {
  path: ['expectedEndDate'], message: 'Provide both dates; end date must be on or after start date.',
});
