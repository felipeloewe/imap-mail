import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Repositoria · Correo",
  description:
    "Servicio de correo e índice histórico de Repositoria (Fase 3)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${sans.variable} ${serif.variable} bg-[radial-gradient(ellipse_at_top,_#f0fdfa_0%,_#fafaf9_45%,_#f5f5f4_100%)] font-[family-name:var(--font-sans)] antialiased text-stone-900`}
      >
        {children}
      </body>
    </html>
  );
}
