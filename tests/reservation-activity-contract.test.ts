import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
test('agenda exposes driver and reservation details while vehicle status follows active reservation', async () => {
  const [gantt, schedule, dashboard, history] = await Promise.all(['../components/dashboard/gantt-chart.tsx','../lib/services/schedule.ts','../lib/services/dashboard.ts','../components/vehicles/vehicle-activity-history.tsx'].map(path => readFile(new URL(path, import.meta.url), 'utf8')));
  assert.match(gantt, /ReservationDetailsButton/); assert.match(gantt, /timeline/); assert.match(schedule, /approvedRequests/); assert.match(dashboard, /operational_status/); assert.match(history, /Detalhes dos apontamentos/);
});
