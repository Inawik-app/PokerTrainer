import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Poker Trainer",
  description:
    "Simulateur de Texas Hold'em No-Limit pour débutants — entraînez-vous contre des bots.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-theme="dark"
      className={`${inter.variable} ${fraunces.variable} dark h-dvh overflow-hidden antialiased`}
    >
      <body className="h-dvh overflow-hidden font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
