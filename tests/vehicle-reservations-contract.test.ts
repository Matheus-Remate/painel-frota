import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const detailPagePath = new URL('../app/dashboard/vehicles/[id]/page.tsx', import.meta.url);
const cardPath = new URL('../components/vehicles/vehicle-reservations-card.tsx', import.meta.url);
const dashboardServicePath = new URL('../lib/services/dashboard.ts', import.meta.url);
const scheduleServicePath = new URL('../lib/services/schedule.ts', import.meta.url);

test('vehicle details include allocated reservations and their event field', async () => {
    const [page, service] = await Promise.all([readFile(detailPagePath, 'utf8'), readFile(dashboardServicePath, 'utf8')]);
    assert.match(page, /VehicleReservationsCard/);
    assert.match(service, /reservations \(/);
    assert.match(service, /driver_name/);
    assert.match(service, /is_emergency/);
});

test('vehicle reservation modal preserves atomic update and excludes emergency records', async () => {
    const [card, schedule] = await Promise.all([readFile(cardPath, 'utf8'), readFile(scheduleServicePath, 'utf8')]);
    assert.match(card, /Editar reserva do veículo/);
    assert.match(card, /name="purpose"/);
    assert.match(card, /name="startDate"/);
    assert.match(card, /name="endDate"/);
    assert.match(card, /name="driverId"/);
    assert.match(card, /!reservation\.is_emergency/);
    assert.match(schedule, /update_reservation_for_pickup/);
    assert.match(schedule, /Reservas emergenciais são encerradas pela devolução/);
    assert.match(schedule, /revalidatePath\(`\/dashboard\/vehicles\/\$\{reservation\.vehicle_id\}`\)/);
});
