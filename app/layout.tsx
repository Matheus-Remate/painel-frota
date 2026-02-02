import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Controle de Frota",
    description: "Sistema de gestão de frota com check-in mobile e dashboard desktop",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    );
}
