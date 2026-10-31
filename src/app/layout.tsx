import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Questrial } from "next/font/google";
import "./globals.css";

/** Body: Questrial ≈ Questia (Repositoria product). */
const questrial = Questrial({
  weight: "400",
  variable: "--font-questrial",
  subsets: ["latin"],
});

/** Display: bold modern headings paired with Questrial. */
const jakarta = Plus_Jakarta_Sans({
  weight: ["600", "700", "800"],
  variable: "--font-display-face",
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
      <body className={`${questrial.variable} ${jakarta.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
