import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

/** Body: misma familia que el shell CI4 de Repositoria. */
const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body-face",
  subsets: ["latin"],
});

/** Display / nav: Space Grotesk como en Repositoria. */
const grotesk = Space_Grotesk({
  weight: ["500", "600", "700"],
  variable: "--font-nav-face",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Repositoria · Correo",
  description:
    "Servicio de correo e índice histórico de Repositoria (Fase 3)",
  icons: {
    icon: [
      { url: "/brand/mark.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${jakarta.variable} ${grotesk.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
