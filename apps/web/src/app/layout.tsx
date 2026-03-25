import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coloriage Magique",
  description:
    "Transformez n'importe quelle photo en coloriage imprimable en quelques secondes.",
  openGraph: {
    title: "Coloriage Magique",
    description: "Photo → coloriage imprimable en quelques secondes.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${plusJakartaSans.variable} ${beVietnamPro.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
