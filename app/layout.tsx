import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { SidebarProvider } from "@/lib/contexts/SidebarContext";

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
        <html lang="pt-BR" suppressHydrationWarning>
            <body>
                <ThemeProvider
                    attribute="class"
                    forcedTheme="dark"
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <SidebarProvider>
                            {children}
                        </SidebarProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
