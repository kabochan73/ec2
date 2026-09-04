import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

// 「細いサンセリフ」の基調フォント。Geist は細いウェイトも揃っているのでこのまま使う。
// 等幅は使わないので Geist_Mono は入れない。
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // %s に各ページの title が入る（例: "TOPS | EC-PORTFOLIO"）
  title: {
    default: "EC-PORTFOLIO",
    template: "%s | EC-PORTFOLIO",
  },
  description: "EC-PORTFOLIO — a minimal, monotone apparel brand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 個別のレイアウト（(shop) / admin）は children 側に入る。
          ここは <html><body> のシェルとフォント・globals だけを持つ。 */}
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
