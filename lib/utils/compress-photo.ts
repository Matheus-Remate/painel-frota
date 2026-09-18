const UPLOAD_TARGET_BYTES = 700 * 1024;

export async function compressPhoto(file: File): Promise<File> {
    // Five checklist photos must also fit within the hosting request-body limit.
    if (file.size <= UPLOAD_TARGET_BYTES) return file;

    const image = new Image();
    const url = URL.createObjectURL(file);
    try {
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Não foi possível abrir a foto para reduzir o tamanho.'));
            image.src = url;
        });
        const canvas = document.createElement('canvas');
        let scale = Math.min(1, 2400 / Math.max(image.width, image.height));
        for (let attempt = 0; attempt < 6; attempt++) {
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Este navegador não consegue processar a foto.');
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', Math.max(0.48, 0.82 - attempt * 0.07)));
            if (blob && blob.size <= UPLOAD_TARGET_BYTES) {
                return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
            }
            scale *= 0.75;
        }
        throw new Error('Não foi possível reduzir a foto para envio. Tente outra imagem; esta não foi descartada.');
    } finally {
        URL.revokeObjectURL(url);
    }
}
