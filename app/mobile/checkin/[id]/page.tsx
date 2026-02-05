import { redirect } from "next/navigation";

export default async function CheckinRedirectPage({ params }: { params: Promise<{ id: string }> }) {
    // Redireciona links antigos (/mobile/checkin/ID) para a nova rota (/mobile/vehicle/ID)
    const { id } = await params;
    redirect(`/mobile/vehicle/${id}`);
}
