import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login - Controle de Frota",
    description: "Acesse o sistema de controle de frota",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-bg-body flex items-center justify-center p-4 transition-colors duration-300">
            {children}
        </div>
    );
}
