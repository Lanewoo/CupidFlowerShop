import type { ReactNode } from "react";
import { DM_Sans, Noto_Sans_SC, Playfair_Display } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
});

const sans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const notoSc = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sc",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="zh"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${notoSc.variable}`}
    >
      <body className="store-backdrop min-h-screen font-sans text-stone-800 antialiased">
        {children}
      </body>
    </html>
  );
}
