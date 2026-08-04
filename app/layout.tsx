import type { Metadata } from "next";
import { Outfit, Source_Sans_3 } from "next/font/google";
import { ThemeScript } from "@/components/ThemeSelector";
import "./globals.css";

const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Concert Cost Tracker",
  description: "Track concert spending and fun — see what shows give you the best value.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="night" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${display.variable} ${body.variable} font-body antialiased bg-base-200 text-base-content min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
