import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { InstallPrompt } from "@/components/InstallPrompt";
import { BottomTabBar } from "@/components/BottomTabBar";
import { AuthBoot } from "@/components/AuthBoot";
import { AchievementToastContainer } from "@/components/AchievementToast";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  metadataBase: new URL("https://hangeulvision-main.vercel.app"),
  title: {
    default: "HangeulVision AI — Learn Korean Vocabulary with AI",
    template: "%s · HangeulVision AI",
  },
  description:
    "Master TOPIK vocabulary through AI-generated concept images, Hanja decomposition, English mnemonics, and spaced repetition. Free to start.",
  keywords: [
    "TOPIK",
    "Korean vocabulary",
    "learn Korean",
    "한국어",
    "AI",
    "flashcards",
    "spaced repetition",
    "KIIP",
    "EPS-TOPIK",
    "Hanja",
  ],
  openGraph: {
    title: "HangeulVision AI — Korean, Visualized.",
    description:
      "Every Korean word gets an AI concept image, Hanja breakdown, and mnemonic. Built for TOPIK, KIIP, and EPS learners.",
    url: "https://hangeulvision-main.vercel.app",
    siteName: "HangeulVision AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HangeulVision AI — Korean, Visualized.",
    description:
      "AI-powered Korean vocabulary learning with Hanja decomposition and mnemonics.",
  },
  robots: { index: true, follow: true },
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider messages={messages}>
        <AuthBoot />
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:pb-24 sm:pt-10">
          {children}
        </main>
        <ConditionalFooter />
        <BottomTabBar />
        <AchievementToastContainer />
        <InstallPrompt />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "HangeulVision AI",
              url: "https://hangeulvision-main.vercel.app",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web, iOS, Android",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free tier with 800 TOPIK I words" },
              description: "AI-powered Korean vocabulary for TOPIK, KIIP and EPS with concept images, hanja breakdown, and spaced repetition.",
              publisher: { "@type": "Organization", name: "Unipath", url: "https://hangeulvision-main.vercel.app" },
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(()=>{}); }); }`,
          }}
        />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
