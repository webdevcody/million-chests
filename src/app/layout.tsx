import type { Metadata } from "next";
import { Patrick_Hand } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const patrick = Patrick_Hand({ subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  title: "Million Chests",
  description: "Open Chests to find codes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="halloween">
      <body className={patrick.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
