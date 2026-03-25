import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
