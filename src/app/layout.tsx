import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Afterimage — A journal for the films that stay",
    template: "%s · Afterimage",
  },
  description:
    "Keep the notes, people, places, and feelings attached to the films you watch.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#090a0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#e87357",
              colorBackground: "#141515",
              colorForeground: "#f2eee6",
              colorMutedForeground: "#a3a09a",
              borderRadius: "0.875rem",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
