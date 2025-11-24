import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ギター初心者エフェクターボード",
  description: "初心者でも30秒でエフェクターの違いがわかる！スマホ最適化ギターエフェクターシミュレーター",
  keywords: ["ギター", "エフェクター", "初心者", "ペダルボード", "シミュレーター"],
  openGraph: {
    title: "ギター初心者エフェクターボード",
    description: "初心者でも30秒でエフェクターの違いがわかる！",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
