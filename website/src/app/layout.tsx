import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "BAHB | Autonomous Drone Inspection for Critical Infrastructure",
  description:
    "Enterprise-grade AI-powered drone inspection services for data centers, substations, and critical infrastructure. Real-time analysis, thermal imaging, and automated reporting.",
  keywords: [
    "drone inspection",
    "AI infrastructure inspection",
    "data center monitoring",
    "substation inspection",
    "thermal imaging",
    "autonomous drones",
  ],
  openGraph: {
    title: "BAHB | Autonomous Drone Inspection",
    description: "Enterprise-grade AI-powered drone inspection for critical infrastructure",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
