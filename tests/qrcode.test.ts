import test from 'node:test';
import assert from 'node:assert/strict';
import { extractVehicleIdFromUrl, generateVehicleQRCode } from '../lib/utils/qrcode.ts';

const vehicleId = 'd4af75c0-a905-4e4e-a8aa-8a357c4980e9';
const token = '69bd0d92-97de-4625-a1fd-29923b2151f0';

test('QR points directly to the protected mobile vehicle flow', async () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://painel-frota.vercel.app';
    const result = await generateVehicleQRCode(vehicleId, 'ABC1D23', token);
    assert.equal(result.jsonData, `https://painel-frota.vercel.app/mobile/vehicle/${vehicleId}?token=${token}`);
    assert.match(result.dataUrl, /^data:image\/png;base64,/);
    process.env.NEXT_PUBLIC_APP_URL = previous;
});

test('scanner extracts the vehicle id from the protected QR URL', () => {
    assert.equal(extractVehicleIdFromUrl(`https://painel-frota.vercel.app/mobile/vehicle/${vehicleId}?token=${token}`), vehicleId);
});
