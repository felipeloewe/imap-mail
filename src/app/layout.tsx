import type { Metadata } from "next";
import { Questrial } from "next/font/google";
import "./globals.css";

/** Questrial ≈ Questia reference used across Repositoria product UI. */
const questrial = Questrial({
  weight: "400",
  variable: "--font-questrial",
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
      <body className={`${questrial.variable} antialiased`}>{children}</body>
    </html>
  );
}
