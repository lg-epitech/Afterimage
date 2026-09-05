import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Archivo, Newsreader } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  axes: ["wdth"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Afterimage",
    template: "%s | Afterimage",
  },
  description:
    "A private journal for the films you watch: how they left you, who was there, and what you want to remember.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#121214",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#8e89ff",
              colorBackground: "#1b1b1e",
              colorForeground: "#f4f3ef",
              colorMutedForeground: "#a9a8a3",
              colorInput: "#121214",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
