import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={mono.variable}>
      <body className="font-[family-name:var(--font-mono)]">{children}</body>
    </html>
  );
}