import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniDwnld - Universal Media Downloader",
  description: "Download videos, audio, and content from 100+ platforms instantly. No signup required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
