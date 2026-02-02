import QRCode from 'qrcode';

export interface VehicleQRData {
    vehicleId: string;
    licensePlate: string;
    checkInUrl: string;
}

export async function generateVehicleQRCode(
    vehicleId: string,
    licensePlate: string
): Promise<{ dataUrl: string; jsonData: string }> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkInUrl = `${baseUrl}/mobile/checkin/${vehicleId}`;

    const qrData: VehicleQRData = {
        vehicleId,
        licensePlate,
        checkInUrl
    };

    const jsonData = JSON.stringify(qrData);

    const dataUrl = await QRCode.toDataURL(jsonData, {
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    });

    return { dataUrl, jsonData };
}

export function parseQRCode(qrString: string): VehicleQRData {
    try {
        return JSON.parse(qrString);
    } catch {
        throw new Error('QR Code inválido');
    }
}
