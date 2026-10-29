import type { Metadata, Viewport } from "next";
import { MotionProvider } from "@/components/ui/MotionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaMoney",
  description: "Catat dan pantau keuangan pribadi",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display -- icon font; "block" hides raw ligature names while loading */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="min-h-full font-sans">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
