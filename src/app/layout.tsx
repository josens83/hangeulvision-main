import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InstallPrompt } from "@/components/InstallPrompt";

export const metadata: Metadata = {
  metadataBase: new URL("https://hangeulvision.app"),
  title: {
    default: "HangeulVision AI — Korean, Visualized.",
    template: "%s · HangeulVision AI",
  },
  description:
    "AI-powered Korean vocabulary for TOPIK, KIIP and EPS. Every word gets an AI-generated concept image, hanja breakdown, mnemonic and SRS review.",
  keywords: [
    "TOPIK",
    "Korean vocabulary",
    "한국어 단어",
    "KIIP",
    "EPS-TOPIK",
    "AI Korean",
    "learn Korean",
  ],
  openGraph: {
    title: "HangeulVision AI — Korean, Visualized.",
    description:
      "The world's first AI-image-based Korean vocabulary app — built for TOPIK, KIIP and EPS learners.",
    url: "https://hangeulvision.app",
    siteName: "HangeulVision AI",
    locale: "en_US",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HangeulVision AI",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-apple.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#14a896",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:pt-10">{children}</main>
        <Footer />
        <InstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(()=>{}); }); }`,
          }}
        />
      </body>
    </html>
  );
}
