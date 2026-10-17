import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FactoryPilot | Production Machine Monitoring & Industrial RAG",
  description: "Production-grade predictive maintenance, ISO 10816 vibration severity analytics, and automated machinery technical manual retrieval.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-industrial-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
