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
    const checkInUrl = `${baseUrl}/veiculo/${vehicleId}`;

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

export function extractVehicleIdFromUrl(text: string): string | null {
    // 1. Se for uma URL completa (ex: http://.../mobile/return/UUID)
    try {
        const url = new URL(text);
        const pathParts = url.pathname.split('/');
        // Pega o último segmento que pareça um UUID
        const possibleId = pathParts[pathParts.length - 1];
        if (possibleId && possibleId.length > 20) { // Validação básica de tamanho
            return possibleId;
        }
    } catch {
        // Não é URL válida, ignora
    }

    // 2. Se for JSON (nosso QR code gera JSON)
    try {
        const data = JSON.parse(text);
        if (data.vehicleId) {
            return data.vehicleId;
        }
    } catch {
        // Não é JSON
    }

    // 3. Se for apenas o UUID puro
    if (text.trim().length > 20) {
        return text.trim();
    }

    return null;
}
