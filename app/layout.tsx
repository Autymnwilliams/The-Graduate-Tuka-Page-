import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-averia",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tuka Hotel Pilot",
  description: "Curated local recommendations for hotel guests, powered by Tuka.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Same Clerk application as backend_main/circle-frontend-web (same
    // NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/CLERK_SECRET_KEY) -- this is what
    // makes a signed-in session automatically shared across tuka.world and
    // app.tuka.world, since Clerk shares sessions across subdomains of one
    // root domain by default.
    <ClerkProvider>
      <html lang="en" className={`${ebGaramond.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
