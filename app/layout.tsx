import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { THEME_COOKIE } from "@/components/shell/prefs";
import { MotionProvider } from "@/components/ui/MotionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaMoney",
  description: "Catat dan pantau keuangan pribadi",
  applicationName: "TaMoney",
  // Home Screen app on iOS: full screen, content runs under a translucent status bar (safe areas handled)
  appleWebApp: { capable: true, title: "TaMoney", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/icons/32.png", sizes: "32x32", type: "image/png" }], apple: "/icons/apple-180.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = (await cookies()).get(THEME_COOKIE)?.value;
  return (
    <html lang="id" className="h-full antialiased" data-theme={theme === "light" || theme === "dark" ? theme : undefined}>
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
